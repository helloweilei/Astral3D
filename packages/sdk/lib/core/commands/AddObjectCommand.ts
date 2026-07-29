import { Command } from './Command';
import { ObjectLoader } from '../loader/ObjectLoader';
import App from "../app/App";

/**
 * @param object THREE.Object3D
 * @param parent 可选父级；默认加入场景根
 * @param index 插入到 parent.children 的位置
 * @constructor
 */
class AddObjectCommand extends Command {
	public object;
	public parent;
	public index;

	constructor(object, parent?, index?: number) {
		super();

		this.type = 'AddObjectCommand';
		this.object = object;
		this.parent = parent;
		this.index = index;
		if (object !== undefined) {
			this.name = `Add object`;
		}
	}

	execute() {
		App.addObject(this.object, this.parent, this.index);
		App.select(this.object);
	}

	undo() {
		App.removeObject(this.object);
		App.deselect();
	}

	toJSON() {
		const output = super.toJSON() as any;
		output.object = this.object.toJSON();
		output.parentUuid = this.parent?.uuid;
		output.index = this.index;
		return output;
	}

	fromJSON(json) {
		super.fromJSON(json);
		this.object = App.getObjectByUuid(json.object.object.uuid);
		this.parent = json.parentUuid ? App.getObjectByUuid(json.parentUuid) : undefined;
		this.index = json.index;

		if (this.object === undefined) {
			const loader = new ObjectLoader();
			this.object = loader.parse(json.object);
		}
	}
}

export { AddObjectCommand };
