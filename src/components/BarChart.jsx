// Small dependency-free bar chart.
// data = [{ label, value }]
export default function BarChart({
  data,
  height = 170,
  color = '#2563eb',
  fmt = (v) => v,
  labelEvery = 1,
  showValues,
}) {
  const max = Math.max(
    1,
    ...data.map((d) => d.value)
  )

  const values =
    showValues ?? data.length <= 12

  return (
    <div
      className="chart"
      style={{ height }}
    >
      {data.map((d, i) => (
        <div
          className="bar-col"
          key={i}
          title={`${d.label}: ${fmt(d.value)}`}
        >
          <span className="bar-val">
            {values && d.value
              ? fmt(d.value)
              : ''}
          </span>

          <div className="bar-track">
            <div
              className="bar"
              style={{
                height: `${
                  (d.value / max) * 100
                }%`,
                background: color,
              }}
            />
          </div>

          <span className="bar-lab">
            {i % labelEvery === 0
              ? d.label
              : ''}
          </span>
        </div>
      ))}
    </div>
  )
}