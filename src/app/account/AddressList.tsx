"use client";

import { useState, useEffect } from "react";

interface Address {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  isDefault: boolean;
}

export default function AddressList() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", province: "", city: "", district: "", detail: "", isDefault: false });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    const res = await fetch("/api/account/addresses");
    const data = await res.json();
    if (data.success) setAddresses(data.data);
  }

  function resetForm() {
    setForm({ name: "", phone: "", province: "", city: "", district: "", detail: "", isDefault: false });
    setEditingId(null);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const url = editingId
      ? `/api/account/addresses/${editingId}`
      : "/api/account/addresses";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setSuccess(editingId ? "地址已更新" : "地址已添加");
      resetForm();
      fetchAddresses();
    } else {
      setError(data.message);
    }
  }

  function editAddress(addr: Address) {
    setEditingId(addr.id);
    setForm({ name: addr.name, phone: addr.phone, province: addr.province, city: addr.city, district: addr.district, detail: addr.detail, isDefault: addr.isDefault });
  }

  async function deleteAddress(id: string) {
    await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    fetchAddresses();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600 }}>收货地址</h3>
        {!editingId && (
          <button onClick={resetForm} style={{ padding: "6px 14px", fontSize: "13px", background: "#1a3a2a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            新增地址
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px", padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
        <div style={{ display: "flex", gap: "12px" }}>
          <input placeholder="收件人" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={{ flex: 1, padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
          <input placeholder="电话" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required style={{ flex: 1, padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <input placeholder="省" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} required style={{ flex: 1, padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
          <input placeholder="市" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required style={{ flex: 1, padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
          <input placeholder="区" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} required style={{ flex: 1, padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
        </div>
        <input placeholder="详细地址" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} required style={{ padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", outline: "none" }} />
        <label style={{ fontSize: "13px", color: "#666", display: "flex", alignItems: "center", gap: "6px" }}>
          <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
          设为默认地址
        </label>
        {error && <p style={{ color: "#dc2626", fontSize: "13px" }}>{error}</p>}
        {success && <p style={{ color: "#16a34a", fontSize: "13px" }}>{success}</p>}
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="submit" disabled={loading} style={{ padding: "8px 20px", fontSize: "13px", background: "#1a3a2a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            {loading ? "保存中..." : editingId ? "更新地址" : "添加地址"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} style={{ padding: "8px 20px", fontSize: "13px", background: "#eee", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              取消
            </button>
          )}
        </div>
      </form>

      {addresses.length === 0 && !editingId && (
        <p style={{ textAlign: "center", color: "#aaa", padding: "40px 0" }}>暂无地址</p>
      )}

      {addresses.map((addr) => (
        <div key={addr.id} style={{ padding: "12px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 4px" }}>
              {addr.name} {addr.phone}
              {addr.isDefault && <span style={{ fontSize: "11px", color: "#1a3a2a", marginLeft: "8px" }}>[默认]</span>}
            </p>
            <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>
              {addr.province}{addr.city}{addr.district} {addr.detail}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => editAddress(addr)} style={{ fontSize: "12px", color: "#1a3a2a", border: "none", background: "none", cursor: "pointer" }}>编辑</button>
            <button onClick={() => deleteAddress(addr.id)} style={{ fontSize: "12px", color: "#dc2626", border: "none", background: "none", cursor: "pointer" }}>删除</button>
          </div>
        </div>
      ))}
    </div>
  );
}
