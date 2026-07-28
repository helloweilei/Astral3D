import { request } from "@/http/request";

/**
 * 上传
 */
export function fetchUpload(data: { file: File; biz?: string; type?: string }) {
	return request.post<string>(`/common/upload`, data, { headers: { "Content-Type": "multipart/form-data" } });
}
