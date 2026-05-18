"use client";

export default function OrderList() {
  return (
    <div>
      <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>我的订单</h3>
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        {["全部", "待付款", "已发货", "已完成"].map((label, i) => (
          <span
            key={label}
            style={{
              fontSize: "13px", padding: "4px 12px", borderRadius: "4px",
              color: i === 0 ? "#fff" : "#888", background: i === 0 ? "#1a3a2a" : "transparent",
              cursor: "pointer",
            }}
          >
            {label}
          </span>
        ))}
      </div>
      <p style={{ textAlign: "center", color: "#aaa", padding: "60px 0" }}>暂无订单</p>
    </div>
  );
}
