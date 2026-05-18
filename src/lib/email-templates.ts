export function passwordResetTemplate(resetUrl: string, brand: string = "瀹岭"): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
</head>
<body style="margin:0;padding:0;background-color:#F8F7F4;font-family:serif,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F7F4;padding:48px 0">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
          <!-- Header -->
          <tr>
            <td style="background:#1a3a2a;padding:32px 40px;text-align:center">
              <h1 style="margin:0;font-size:22px;color:#fff;font-family:serif;font-weight:600">${brand}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px">
              <p style="margin:0 0 16px;font-size:15px;color:#333">您好，</p>
              <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.8">
                我们收到了您重置密码的请求。请点击下方按钮设置新密码（链接有效期 1 小时）：
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:12px 40px;background:#1a3a2a;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">
                      重置密码
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:12px;color:#aaa">
                如果按钮无法点击，请复制以下链接到浏览器：<br>
                <span style="color:#888">${resetUrl}</span>
              </p>
              <hr style="border:0;border-top:1px solid #eee;margin:32px 0 16px">
              <p style="margin:0;font-size:12px;color:#aaa;line-height:1.8">
                如果您没有申请重置密码，请忽略此邮件。<br>
                此链接 1 小时后失效，且只能使用一次。
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
