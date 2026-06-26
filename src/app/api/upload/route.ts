import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/s3/client';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionWithTenant } from '@/lib/auth/session-with-tenant';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const uploadSchema = z.object({
  image: z.string().min(1),
  entityType: z.enum(['member', 'dependent', 'space']).default('member'),
  entityId: z.string().uuid().optional(),
  filename: z.string().optional(),
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// POST /api/upload
export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, 'write');
    if (!rl.allowed) {
      const retryAfter = Math.ceil((rl.retryAfterMs ?? 0) / 1000);
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
          },
        }
      );
    }

    const sessionData = await getSessionWithTenant(request.headers);
    const tenantId = sessionData?.user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId não encontrado na sessão' }, { status: 400 });
    }

    const body = await request.json();
    const validated = uploadSchema.parse(body);

    // Decode base64 image
    const base64Data = validated.image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Validate size
    if (imageBuffer.length > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Imagem muito grande (máximo 5MB)' },
        { status: 400 }
      );
    }

    // Determine content type from base64 prefix
    let contentType = 'image/jpeg';
    const prefix = validated.image.substring(0, 20).toLowerCase();
    if (prefix.includes('png')) contentType = 'image/png';
    else if (prefix.includes('webp')) contentType = 'image/webp';
    else if (prefix.includes('gif')) contentType = 'image/gif';

    // Validate content type
    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: 'Tipo de imagem não permitido (use JPEG, PNG, WebP ou GIF)' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const extension = contentType.split('/')[1];
    const uniqueId = uuidv4();
    const entityPath = validated.entityType;
    const key = `${tenantId}/${entityPath}/${uniqueId}.${extension}`;

    // Upload to S3
    const result = await uploadFile(key, imageBuffer, contentType);

    const response = NextResponse.json({
      url: result.url,
      key: result.key,
      message: 'Upload realizado com sucesso',
    });

    response.headers.set('X-RateLimit-Remaining', String(rl.remaining));
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.format() }, { status: 400 });
    }
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 });
  }
}
