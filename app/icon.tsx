import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
          borderRadius: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 108,
        }}
      >
        🔖
      </div>
    ),
    { width: 192, height: 192 }
  );
}
