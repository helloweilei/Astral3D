import { Command } from './Command';

/**
 * 将多条命令打包为一次历史记录，便于成组/拆组等复合操作一次撤销。
 */
class MultiCmdsCommand extends Command {
	public commands: Array<{
		execute: () => void;
		undo: () => void;
		toJSON?: () => any;
		fromJSON?: (json: any) => void;
	}>;

	constructor(commands: MultiCmdsCommand['commands'] = [], name = 'MultiCmds') {
		super();
		this.type = 'MultiCmdsCommand';
		this.name = name;
		this.commands = commands;
	}

	execute() {
		for (let i = 0; i < this.commands.length; i++) {
			this.commands[i].execute();
		}
	}

	undo() {
		for (let i = this.commands.length - 1; i >= 0; i--) {
			this.commands[i].undo();
		}
	}

	toJSON() {
		const output = super.toJSON() as any;
		output.commands = this.commands.map(cmd => (cmd.toJSON ? cmd.toJSON() : null));
		return output;
	}

	fromJSON(json: any) {
		super.fromJSON(json);
		// 历史回放场景较少用到；成组/拆组主要依赖内存中的 undo 栈
		this.commands = json.commands || [];
	}
}

export { MultiCmdsCommand };
