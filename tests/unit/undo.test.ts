import { beforeEach, describe, expect, it } from "vitest";
import { createSampleData } from "../../src/data/sample.demo";
import { actions, getState } from "../../src/lib/store";

// Môi trường kiểm thử không có window.localStorage nên kho chạy trong bộ nhớ.
describe("hoàn tác có phạm vi", () => {
  beforeEach(() => actions.replaceData(createSampleData()));

  it("xóa lịch thi rồi hoàn tác: lịch về đúng chỗ, giữ thay đổi khác làm sau đó", () => {
    const before = getState().data;
    const exam = before.exams[0];
    actions.removeExam(exam.id);
    actions.setConditions({ pe: "exempt" });
    actions.restore(before, { examId: exam.id });
    const data = getState().data;
    expect(data.exams.map((item) => item.id)).toEqual(before.exams.map((item) => item.id));
    expect(data.conditions.pe).toBe("exempt");
    // hoàn tác lần nữa không nhân đôi lịch
    actions.restore(before, { examId: exam.id });
    expect(getState().data.exams).toHaveLength(before.exams.length);
  });

  it("xóa lịch học rồi hoàn tác", () => {
    const before = getState().data;
    const item = before.classes[1];
    actions.removeClass(item.id);
    expect(getState().data.classes.some((entry) => entry.id === item.id)).toBe(false);
    actions.restore(before, { classId: item.id });
    expect(getState().data.classes[1]).toEqual(item);
  });

  it("xóa điểm rồi hoàn tác: chỉ trả lại học phần đó", () => {
    const before = getState().data;
    const [id, record] = Object.entries(before.records).find(([, value]) => value.score !== null)!;
    actions.setRecord(id, { status: "doing", score: null });
    actions.setRecord("MTH00022", { status: "done", score: 6 });
    actions.restore(before, { records: [id] });
    const data = getState().data;
    expect(data.records[id]).toEqual(record);
    expect(data.records.MTH00022).toMatchObject({ status: "done", score: 6 });
  });

  it("bỏ chọn môn tự chọn rồi hoàn tác: tick lại và trả kết quả", () => {
    const before = getState().data;
    const record = before.records.PHY00081;
    actions.toggleSelection("ge-science", "PHY00081", false);
    expect(getState().data.selections["ge-science"]).not.toContain("PHY00081");
    actions.restore(before, {
      records: ["PHY00081"],
      select: { groupId: "ge-science", courseId: "PHY00081" },
    });
    const data = getState().data;
    expect(data.selections["ge-science"]).toContain("PHY00081");
    expect(data.records.PHY00081).toEqual(record);
  });

  it("đặt lại toàn bộ rồi hoàn tác", () => {
    const before = getState().data;
    actions.resetAll();
    expect(getState().data.exams).toHaveLength(0);
    actions.restoreAll(before);
    expect(getState().data.profile.name).toBe(before.profile.name);
    expect(getState().data.classes).toHaveLength(before.classes.length);
    expect(getState().loadStatus).toBe("ok");
  });
});
