import { ImageResponse } from 'next/og';

export async function GET() {
  const inter = await fetch(
    new URL('https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7SUc.woff2')
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div tw="relative w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col items-center justify-center text-white">
        <div tw="absolute inset-0 bg-white/10 backdrop-blur-sm" />

        <div tw="relative z-10 text-center">
          <div tw="text-8xl mb-6">🏌️</div>
          <h1 tw="text-6xl font-bold mb-4">Socio Desk</h1>
          <p tw="text-2xl mb-8 max-w-2xl">
            Plataforma SaaS para gestão de clubes recreativos
          </p>
          <div tw="text-lg opacity-80">
            Reservas • Associados • Finanças
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: inter,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  );
}