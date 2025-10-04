用户已完成需求配置！

## 本轮用户回答

{{userAnswers}}

---

## 📝 重要提醒

**请你在对话中记住以下信息：**

1. **初始项目想法**：（你最开始从用户那里得到的项目描述）
2. **当前完善的需求描述**：（整合之前所有回答后的完整需求）
3. **本轮回答**：上面显示的用户回答
4. **历史回答**：（如果有多轮，请累积记录）

---

## 下一步操作

用户回答已保存到文件：`{{userResponseFilePath}}`

**请立即调用 MCP 工具 `mcp_spec-kit-ui_analyze` 分析用户回答**

**必须使用以下格式调用工具：**

```json
{
  "projectIdea": "（传入你当前掌握的最完善的需求描述，如果是第一轮就传初始想法）",
  "userAnswers": "（将上面的用户回答文本作为字符串传入）",
  "userResponseFilePath": "{{userResponseFilePath}}"
}
```

**完整调用示例：**

- 工具名称：`mcp_spec-kit-ui_analyze`
- 参数对象：包含三个字段
  - `projectIdea`（必填）：当前最完善的需求描述文本
  - `userAnswers`（必填）：上面显示的用户回答文本
  - `userResponseFilePath`（必填）：用户回答保存的文件路径

该工具将返回新的提示词，指导你：

- ✅ 如果需求明确 → 将需求总结写入文件，然后调用 `mcp_spec-kit-ui_build` 工具生成命令
- ❓ 如果需求不明确 → 调用 `mcp_spec-kit-ui_gather` 工具继续提问

**现在请立即调用工具！**
