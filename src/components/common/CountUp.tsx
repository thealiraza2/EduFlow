"use client";

import { useEffect, useState, useRef } from "react";

interface CountUpProps {
  value?: number | string | null;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function CountUp({
  value = 0,
  duration = 900,
  className,
  prefix = "",
  suffix = "",
  decimals,
}: CountUpProps) {
  const safeValue = value ?? 0;
  const isString = typeof safeValue === "string";
  let targetNumber = 0;
  let detectedPrefix = prefix;
  let detectedSuffix = suffix;

  if (typeof safeValue === "number") {
    targetNumber = safeValue;
  } else {
    // Check if string contains currency or suffix
    const match = safeValue.match(/([^\d.,\-]*)([\d,]+(?:\.\d+)?)(.*)/);
    if (match) {
      if (!prefix && match[1]) detectedPrefix = match[1];
      const cleanNum = match[2].replace(/,/g, "");
      targetNumber = parseFloat(cleanNum) || 0;
      if (!suffix && match[3]) detectedSuffix = match[3];
    } else {
      targetNumber = parseFloat(safeValue) || 0;
    }
  }

  // Determine decimal places
  const autoDecimals =
    decimals !== undefined
      ? decimals
      : isString && safeValue.includes(".")
      ? (safeValue.split(".")[1] || "").replace(/[^\d]/g, "").length
      : Math.floor(targetNumber) === targetNumber
      ? 0
      : 1;

  const [displayValue, setDisplayValue] = useState<number>(targetNumber);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion || duration <= 0) {
      setDisplayValue(targetNumber);
      return;
    }

    let startTimestamp: number | null = null;
    const startValue = 0;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);

      // easeOutExpo
      const easeProgress =
        progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const current = startValue + (targetNumber - startValue) * easeProgress;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetNumber);
        hasAnimatedRef.current = true;
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [targetNumber, duration]);

  const formattedNumber =
    autoDecimals > 0
      ? displayValue.toLocaleString("en-US", {
          minimumFractionDigits: autoDecimals,
          maximumFractionDigits: autoDecimals,
        })
      : Math.round(displayValue).toLocaleString("en-US");

  return (
    <span className={className}>
      {detectedPrefix}
      {formattedNumber}
      {detectedSuffix}
    </span>
  );
}
