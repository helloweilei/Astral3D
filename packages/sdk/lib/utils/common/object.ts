/**
 * 将对象source的值深度遍历赋值给target对象相同key
 * @param target
 * @param source
 */
export function deepAssign(target, source) {
	for (const key in source) {
		if (source.hasOwnProperty(key)) {
			if (typeof source[key] === "object" && source[key] !== null && !Array.isArray(source[key])) {
				if (!target[key]) {
					target[key] = {};
				}
				deepAssign(target[key], source[key]);
			} else {
				target[key] = source[key];
			}
		}
	}
}

/**
 * 深度比较两个值是否相等
 * @param {any} a
 * @param {any} b
 * @returns {boolean}
 */
export function deepEqual(a, b) {
	// 引用相同
	if (a === b) return true;

	// 排除 null
	if (a === null || b === null) return false;

	// 类型不同
	if (typeof a !== typeof b) return false;

	// 处理日期对象
	if (a instanceof Date && b instanceof Date) {
		return a.getTime() === b.getTime();
	}

	// 处理数组
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i++) {
			if (!deepEqual(a[i], b[i])) return false;
		}
		return true;
	}

	// 处理对象
	if (typeof a === "object" && typeof b === "object") {
		const keysA = Object.keys(a);
		const keysB = Object.keys(b);
		if (keysA.length !== keysB.length) return false;
		for (let key of keysA) {
			if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
			if (!deepEqual(a[key], b[key])) return false;
		}
		return true;
	}

	// 其他基本类型
	return false;
}
