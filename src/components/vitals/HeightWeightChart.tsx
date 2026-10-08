"use client";
import { useEffect, useRef } from "react";

// Lowest values printed on the chart axes; anything below plots off-chart.
const MIN_HEIGHT_CM = 80;
const MIN_WEIGHT_KG = 10;

// Pixel offsets calibrated to match the printed grid on each chart image.
const CHART_CONFIG = {
  male: {
    src: "/boyhwgraph.png",
    xOrigin: 95,
    xStep: 23.5,
    weightOrigin: 765,
    weightScale: 4.52,
    heightOrigin: 607,
    heightScale: 4.52,
  },
  female: {
    src: "/girlhwgraph.png",
    xOrigin: 115,
    xStep: 22.67,
    weightOrigin: 742,
    weightScale: 4.25,
    heightOrigin: 593,
    heightScale: 4.25,
  },
} as const;

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCross(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string,
  size = 3,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - size, cy - size);
  ctx.lineTo(cx + size, cy + size);
  ctx.stroke();
  ctx.moveTo(cx + size, cy - size);
  ctx.lineTo(cx - size, cy + size);
  ctx.stroke();
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  text: string,
  color: string,
  crossSize = 3,
) {
  const W = 75,
    H = 25,
    R = 5;
  const x = cx + crossSize;
  const y = cy - crossSize - H / 2;

  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  drawRoundedRect(ctx, x, y, W, H, R);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.font = "14px Arial";
  ctx.fillText(text, x + 5, cy - crossSize);
}

type Props = {
  age: number;
  height: number | null;
  weight: number | null;
  gender: "male" | "female";
};

export function HeightWeightChart({ age, height, weight, gender }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const hasValues =
    height !== null && weight !== null && !isNaN(height) && !isNaN(weight);
  const inRange =
    hasValues && height >= MIN_HEIGHT_CM && weight >= MIN_WEIGHT_KG;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !inRange) return;

    const config = CHART_CONFIG[gender];
    // age axis starts at 2, weight axis at 10 kg, height axis at 80 cm
    const xPixel = config.xOrigin + (age - 2) * config.xStep;
    const weightPixel =
      config.weightOrigin - (weight - 10) * config.weightScale;
    const heightPixel =
      config.heightOrigin - (height - 80) * config.heightScale;

    const image = new Image();
    // Required so drawImage doesn't taint the canvas if the asset moves to a CDN.
    image.crossOrigin = "anonymous";
    image.src = config.src;
    image.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
      drawCross(ctx, xPixel, weightPixel, "red");
      drawLabel(ctx, xPixel, weightPixel, `${weight} kg`, "red");
      drawCross(ctx, xPixel, heightPixel, "blue");
      drawLabel(ctx, xPixel, heightPixel, `${height} cm`, "blue");
    };

    return () => {
      image.onload = null;
    };
  }, [age, weight, height, gender, inRange]);

  if (!hasValues) {
    return (
      <p className="text-sm text-slate-500">
        Enter height and weight to plot the growth chart.
      </p>
    );
  }

  if (!inRange) {
    return (
      <p className="text-sm text-slate-500">
        Growth chart only plots heights from {MIN_HEIGHT_CM} cm and weights
        from {MIN_WEIGHT_KG} kg.
      </p>
    );
  }

  return (
    // Dimensions must match the PNG size so drawImage fills the canvas exactly.
    <canvas
      ref={canvasRef}
      width={600}
      height={800}
      className="w-full h-auto max-w-full"
    />
  );
}
