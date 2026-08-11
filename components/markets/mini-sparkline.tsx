export function MiniSparkline({ positive = true }: { positive?: boolean }) {
  // Deterministic pseudo-random path so it's stable across renders.
  const points = positive
    ? "0,20 10,18 20,14 30,16 40,10 50,12 60,6 70,8 80,3 90,5 100,1"
    : "0,4 10,6 20,5 30,9 40,7 50,12 60,10 70,15 80,13 90,18 100,20";

  return (
    <svg viewBox="0 0 100 24" className="h-6 w-full" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#22C55E" : "#EF4444"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
