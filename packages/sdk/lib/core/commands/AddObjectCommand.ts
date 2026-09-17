import { Command } from './Command';
import { ObjectLoader } from '../loader/ObjectLoader';
import App from "../app/App";
import { snapObjectToGround } from "@/utils/scene/object";

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

	/** 是否允许本次添加贴地；场景恢复、成组等应传 false */
	public snapToGround: boolean;
	private snapped = false;

	constructor(object, parent?, index?: number, snapToGround = true) {
		super();

		this.type = 'AddObjectCommand';
		this.object = object;
		this.parent = parent;
		this.index = index;
		this.snapToGround = snapToGround;
		if (object !== undefined) {
			this.name = `Add object`;
		}
	}

	execute() {
		// 只在第一次加入时贴地，避免撤销重做时改掉用户后来拖过的高度
		if (this.snapToGround && !this.snapped) {
			this.snapped = true;
			if (App.project.getKey("editor.snapOnAdd") !== false) {
				snapObjectToGround(this.object);
			}
		}
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
		output.snapToGround = this.snapToGround;
		output.snapped = this.snapped;
		return output;
	}

	fromJSON(json) {
		super.fromJSON(json);
		this.object = App.getObjectByUuid(json.object.object.uuid);
		this.parent = json.parentUuid ? App.getObjectByUuid(json.parentUuid) : undefined;
		this.index = json.index;
		this.snapToGround = json.snapToGround !== false;
		this.snapped = !!json.snapped;

		if (this.object === undefined) {
			const loader = new ObjectLoader();
			this.object = loader.parse(json.object);
		}
	}
}

export { AddObjectCommand };
