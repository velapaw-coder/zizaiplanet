import type { Metadata } from "next";
import { Notice } from "@/components/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { currentUser } from "@/lib/auth";
import { adminSnapshot } from "@/lib/content";
import { adminLlmStatus } from "@/lib/llm";
import { getCommunityWecomQrUrl } from "@/lib/site-settings";
import { formatWhen, one } from "@/lib/text";

export const metadata: Metadata = { title: "运营" };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await currentUser();
  if (!user || user.role !== "admin") {
    return (
      <main className="section tight">
        <div className="wrap">
          <h1 className="page-title">运营后台</h1>
          <p className="help">
            {user ? "这个账号还不是运营管理员。" : "请先用管理员邮箱登录。"}
            本地可以把 admin@zizaiplanet.com 填进登录页。
          </p>
          <a className="btn-primary" href={user ? "/garden" : "/join?login=1&next=/admin"}>
            {user ? "回我的家园" : "去登录"}
          </a>
        </div>
      </main>
    );
  }
  const data = await adminSnapshot();
  const llm = await adminLlmStatus();
  const qrUrl = await getCommunityWecomQrUrl();
  const hasCustomQr = qrUrl.startsWith("/api/media/");
  const groups = new Map<string, typeof llm.presets>();
  for (const item of llm.presets) {
    const list = groups.get(item.group) || [];
    list.push(item);
    groups.set(item.group, list);
  }
  return (
    <main className="section tight">
      <div className="wrap stack">
        <div>
          <div className="kicker">STUDIO</div>
          <h1 className="page-title">运营</h1>
          <p className="help">处理举报、茶局提议，配置七维对话大模型，以及发布生活志和能量站。这里没有招商，也没有积分。</p>
          <Notice text={one(params.notice)} />
        </div>
        <section className="share">
          <h2 className="serif" style={{ marginTop: 0 }}>
            社区企业微信二维码
          </h2>
          <p className="help">
            七维自我探索方案页与 PDF 会嵌入这张企业微信活码。上传后保存在媒体库，并写入站点设置
            <code> community_wecom_qr_url </code>
            ，前台与 PDF 会自动使用新图。支持 PNG / JPG / WebP，建议正方形、小于 2MB；PDF 嵌入优先用 PNG 或 JPG。
          </p>
          <div className="row-actions" style={{ alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="企业微信社区二维码"
                width={120}
                height={120}
                style={{ borderRadius: 10, border: "1px solid #D4E4E8", background: "#fff", objectFit: "contain" }}
              />
            ) : (
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 10,
                  border: "1px dashed #D4E4E8",
                  display: "grid",
                  placeItems: "center",
                  color: "#6B858A",
                  fontSize: 12,
                  textAlign: "center",
                  padding: 8,
                }}
              >
                尚未配置二维码
              </div>
            )}
            <div className="stack" style={{ gap: 8, minWidth: 220 }}>
              <p className="help" style={{ margin: 0 }}>
                {hasCustomQr ? "当前为运营上传的活码。" : "当前仍是站点默认占位图，请尽快换成正式活码。"}
              </p>
              <a href={qrUrl} target="_blank" rel="noreferrer">
                查看当前二维码
              </a>
              <form action="/api/action" method="post" encType="multipart/form-data" className="stack" style={{ gap: 8 }}>
                <input type="hidden" name="action" value="admin_wecom_qr" />
                <div className="field" style={{ margin: 0 }}>
                  <Label htmlFor="wecom-qr">更换图片</Label>
                  <Input
                    id="wecom-qr"
                    name="qr"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    required
                  />
                </div>
                <div className="row-actions">
                  <Button type="submit">上传并更换</Button>
                </div>
              </form>
            </div>
          </div>
        </section>
        <section className="share">
          <h2 className="serif" style={{ marginTop: 0 }}>
            大模型服务商
          </h2>
          <p className="help">
            平台方在这里选择七维自我探索对话使用的默认服务商。居民前台不显示选择器。API 密钥仍用 Cloudflare secrets，不在此明文保存。
          </p>
          <div className="admin-llm-status">
            <span className={`admin-llm-pill${llm.active.configured ? "" : " warn"}`}>
              当前：{llm.active.label} · {llm.active.model}
              {llm.active.configured ? " · 密钥已配置" : " · 密钥未配置（演示模式）"}
            </span>
            <span className="admin-llm-pill">Base：{llm.active.baseUrl}</span>
          </div>
          <form action="/api/action" method="post" className="stack" style={{ gap: 12 }}>
            <input type="hidden" name="action" value="admin_llm" />
            <div className="field">
              <Label htmlFor="llm-preset">服务商（OpenAI 兼容）</Label>
              <select
                id="llm-preset"
                name="preset_id"
                className="admin-llm-select"
                defaultValue={llm.defaultPreset}
                required
              >
                {[...groups.entries()].map(([group, list]) => (
                  <optgroup label={group} key={group}>
                    {list.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.label}
                        {item.configured ? "" : " · 未配置密钥"}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="field">
              <Label htmlFor="llm-model">模型 ID（可空，空则用该服务商默认）</Label>
              <Input
                id="llm-model"
                name="model"
                defaultValue={llm.defaultModel || ""}
                placeholder={llm.active.model || "例如 deepseek-chat"}
              />
            </div>
            <p className="help admin-llm-hint">{llm.secretHint}</p>
            <div className="row-actions">
              <Button type="submit">保存默认模型</Button>
            </div>
          </form>
          <details style={{ marginTop: 14 }}>
            <summary className="help" style={{ cursor: "pointer" }}>
              各服务商密钥状态
            </summary>
            <ul className="help" style={{ marginTop: 8, paddingLeft: "1.2em" }}>
              {llm.presets.map((item) => (
                <li key={item.id}>
                  {item.label}：{item.configured ? "已配置" : "未配置"} · 默认 <code>{item.model || "（环境变量）"}</code>
                </li>
              ))}
            </ul>
          </details>
        </section>
        <section>
          <h2 className="serif">举报</h2>
          {data.reports.length === 0 ? <p className="help">没有举报。</p> : null}
          <table className="admin-table">
            <tbody>
              {data.reports.map((report) => (
                <tr key={report.id}>
                  <td>
                    {report.status === "open" ? "待看" : "已处理"} · {report.target_type}
                    <br />
                    {report.reason}
                    <br />
                    <span className="help">
                      {report.display_name ?? "匿名"} · {formatWhen(report.created_at)}
                    </span>
                  </td>
                  <td>
                    {report.status === "open" ? (
                      <form action="/api/action" method="post">
                        <input type="hidden" name="action" value="admin_resolve" />
                        <input type="hidden" name="id" value={report.id} />
                        <Button type="submit" size="sm" variant="outline">
                          标记已处理
                        </Button>
                      </form>
                    ) : null}
                    <form action="/api/action" method="post">
                      <input type="hidden" name="action" value="admin_hide" />
                      <input type="hidden" name="target_type" value={report.target_type} />
                      <input type="hidden" name="target_id" value={report.target_id} />
                      <Button type="submit" size="sm" variant="ghost">
                        撤下内容
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section>
          <h2 className="serif">待审茶局</h2>
          {data.pending.length === 0 ? <p className="help">没有待审提议。</p> : null}
          {data.pending.map((event) => (
            <article className="share" key={event.id}>
              <h3 className="serif">{event.title}</h3>
              <p className="help">
                {event.theme} · {formatWhen(event.starts_at)} · {event.place}
                <br />
                {event.summary}
              </p>
              <div className="row-actions">
                <form action="/api/action" method="post">
                  <input type="hidden" name="action" value="admin_event" />
                  <input type="hidden" name="id" value={event.id} />
                  <input type="hidden" name="decision" value="approve" />
                  <Button type="submit" size="sm">
                    通过
                  </Button>
                </form>
                <form action="/api/action" method="post">
                  <input type="hidden" name="action" value="admin_event" />
                  <input type="hidden" name="id" value={event.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <Button type="submit" size="sm" variant="outline">
                    不通过
                  </Button>
                </form>
              </div>
            </article>
          ))}
        </section>
        <section className="two">
          <form className="share" action="/api/action" method="post">
            <input type="hidden" name="action" value="admin_article" />
            <h2 className="serif" style={{ marginTop: 0 }}>
              发布生活志
            </h2>
            <Field id="article-slug" name="slug" label="路径" placeholder="slow-morning" />
            <Field id="article-title" name="title" label="标题" />
            <Field id="article-topic" name="topic" label="栏目" placeholder="生活方式 / 自由探索" />
            <Field id="article-tags" name="tags" label="标签" placeholder="慢生活,阅读" />
            <Field id="article-cover" name="cover" label="封面图片地址" />
            <div className="field">
              <Label htmlFor="summary">摘要</Label>
              <Textarea id="summary" name="summary" required />
            </div>
            <div className="field">
              <Label htmlFor="body">正文</Label>
              <Textarea id="body" name="body" required />
            </div>
            <Button type="submit">发布文章</Button>
          </form>
          <form className="share" action="/api/action" method="post">
            <input type="hidden" name="action" value="admin_resource" />
            <h2 className="serif" style={{ marginTop: 0 }}>
              发布能量站
            </h2>
            <Field id="resource-slug" name="slug" label="路径" placeholder="weekend-note" />
            <Field id="resource-title" name="title" label="标题" />
            <Field id="resource-category" name="category" label="分类" />
            <Field id="resource-icon" name="icon" label="图标" placeholder="✳" />
            <Field id="resource-cover" name="cover" label="封面图片地址" placeholder="https://..." />
            <div className="field">
              <Label htmlFor="resource-summary">简介</Label>
              <Textarea id="resource-summary" name="summary" required />
            </div>
            <div className="field">
              <Label htmlFor="prompt">提示词</Label>
              <Textarea id="prompt" name="prompt" required />
            </div>
            <div className="field">
              <Label htmlFor="resource-body">说明</Label>
              <Textarea id="resource-body" name="body" required />
            </div>
            <Button type="submit">发布资源</Button>
          </form>
        </section>
        <section>
          <h2 className="serif">最近的分享</h2>
          <table className="admin-table">
            <tbody>
              {data.posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    {post.author_name} · {post.topic} · {post.status}
                    <br />
                    {post.body.slice(0, 80)}
                  </td>
                  <td>
                    {post.status === "visible" ? (
                      <form action="/api/action" method="post">
                        <input type="hidden" name="action" value="admin_hide" />
                        <input type="hidden" name="target_type" value="post" />
                        <input type="hidden" name="target_id" value={post.id} />
                        <Button type="submit" size="sm" variant="ghost">
                          撤下
                        </Button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}

function Field({
  id,
  name,
  label,
  placeholder,
}: {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
}) {
  return (
    <div className="field">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} placeholder={placeholder} required={name !== "cover" && name !== "icon" && name !== "tags"} />
    </div>
  );
}
