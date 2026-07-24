import type { TreeOption } from 'naive-ui';
export declare function escapeHTML(html: string): string;
/**
 * naive UI树结构寻找对应节点位置及所处父节点
 * @param node 目标节点
 * @param nodes 树数据
 */
export declare function findSiblingsAndIndex(node: TreeOption, nodes?: TreeOption[]): [TreeOption[], number] | [null, null];
export declare function base64ToFile(dataurl: any, filename: any): File;
/**
 * 求次幂
 */
export declare function pow1024(num: any): number;
/**
 * 动态添加script
 * @param src
 * @param async
 */
export declare function loadScript(src: string, async?: boolean): Promise<unknown>;
/**
 * 复制到剪切板
 * @param text
 */
export declare function copyToClipboard(text: string): Promise<unknown>;
/**
 * 获取rem的px值
 */
export declare function remToPxNumber(rem: number): number;
/**
 * 动态注入脚本，并监听执行完毕事件
 * @param {string} src
 */
export declare function injectJS(src: any): Promise<unknown>;
/**
 * 在树形结构中查找指定 key 的节点（深度优先搜索）
 */
export declare function findTreeNode(tree: TreeOption[], targetKey: string | number): TreeOption | null;
/**
 * 使用深度优先遍历（DFS）递归算法，为没有子节点的节点添加 isLeaf: true 属性
 */
export declare function markLeafNodes(tree: TreeOption[]): void;
