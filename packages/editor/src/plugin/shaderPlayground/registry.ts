import type { GradeId, Topic } from "./types";
import { GRADE_ORDER } from "./types";

const topicMap = new Map<string, Topic>();

export function registerTopic(topic: Topic): void {
	if (topicMap.has(topic.id)) {
		console.warn(`[ShaderPlayground] Topic "${topic.id}" already registered, overwriting.`);
	}
	topicMap.set(topic.id, topic);
}

export function registerTopics(topics: Topic[]): void {
	topics.forEach(registerTopic);
}

export function getTopic(id: string): Topic | undefined {
	return topicMap.get(id);
}

export function getTopicsByGrade(grade: GradeId): Topic[] {
	return [...topicMap.values()].filter(t => t.grade === grade).sort((a, b) => a.order - b.order);
}

export function getAllTopics(): Topic[] {
	return GRADE_ORDER.flatMap(g => getTopicsByGrade(g));
}

export function clearTopics(): void {
	topicMap.clear();
}
