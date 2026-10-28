"use client";

import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

export function ReportDialog({
  targetType,
  targetId,
  next,
}: {
  targetType: "post" | "comment";
  targetId: string;
  next: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" type="button">
          举报
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="serif">交给运营看一看</DialogTitle>
        <DialogDescription>说明哪里不合适就好。举报不会公开，也不会给作者发通知。</DialogDescription>
        <form action="/api/action" method="post">
          <input type="hidden" name="action" value="report" />
          <input type="hidden" name="target_type" value={targetType} />
          <input type="hidden" name="target_id" value={targetId} />
          <input type="hidden" name="next" value={next} />
          <div className="field">
            <Label htmlFor={`reason-${targetId}`}>哪里不合适</Label>
            <Textarea id={`reason-${targetId}`} name="reason" required placeholder="例如广告、隐私，或让人不适的内容" />
          </div>
          <Button type="submit">提交</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
