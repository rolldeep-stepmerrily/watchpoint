import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

const Icon = (): ImageResponse =>
  new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fa9c1d',
        color: '#ffffff',
        fontSize: 22,
        fontWeight: 900,
        letterSpacing: -1,
      }}
    >
      W
    </div>,
    { ...size },
  );

export default Icon;
