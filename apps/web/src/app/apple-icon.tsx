import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const AppleIcon = (): ImageResponse =>
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
        fontSize: 120,
        fontWeight: 900,
        letterSpacing: -3,
      }}
    >
      W
    </div>,
    { ...size },
  );

export default AppleIcon;
