import AccountContent from "./AccountContent";

export default function AccountPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 24px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "32px" }}>个人中心</h2>
      <AccountContent />
    </div>
  );
}
