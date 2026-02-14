"use client";

import React from "react";

interface ScoreGaugeProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: { dimension: 80, radius: 28, textSize: "text-xl" },
  md: { dimension: 112, radius: 36, textSize: "text-2xl" },
  lg: { dimension: 128, radius: 40, textSize: "text-3xl" },
};

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  label = "Score",
  size = "md",
}) => {
  const { dimension, radius, textSize } = sizeConfig[size];
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const colorClasses =
    score >= 80
      ? { stroke: "text-green-500", text: "text-green-600" }
      : score >= 60
        ? { stroke: "text-yellow-500", text: "text-yellow-600" }
        : { stroke: "text-red-500", text: "text-red-600" };

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-xl border">
      <svg
        className="-rotate-90"
        width={dimension}
        height={dimension}
      >
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${colorClasses.stroke} transition-all duration-1000`}
        />
      </svg>
      <span className={`${textSize} font-bold ${colorClasses.text}`}>
        {score}
      </span>
      <p className="text-xs uppercase text-gray-400 mt-2">{label}</p>
    </div>
  );
};
