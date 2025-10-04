/**
 * 将用户回答格式化为可读文本
 */
export function formatUserAnswers(userResponse: any): string {
  if (!userResponse || !userResponse.answers || !Array.isArray(userResponse.answers)) {
    return "（无有效回答）";
  }

  const answers = userResponse.answers;
  const sections: Record<string, Array<{ question: string; answer: string; required: boolean }>> = {};

  // 按 section 分组
  for (const item of answers) {
    const section = item.section || "其他";
    if (!sections[section]) {
      sections[section] = [];
    }
    sections[section].push({
      question: item.question,
      answer: item.answer || "（未填写）",
      required: item.required,
    });
  }

  // 生成格式化文本
  let result = "";
  let sectionIndex = 1;
  for (const [sectionName, items] of Object.entries(sections)) {
    result += `\n${sectionIndex}. ${sectionName}\n`;
    for (const item of items) {
      const requiredMark = item.required ? " *（必填）*" : "";
      result += ` - **${item.question}**${requiredMark}: ${item.answer}\n`;
    }
    sectionIndex++;
  }

  return result.trim();
}

