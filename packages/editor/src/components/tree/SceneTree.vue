<script lang="ts" setup>
import { h, ref, onMounted, nextTick, onBeforeUnmount } from "vue";
import { TreeOption, TreeDropInfo, NIcon, NBadge, NEllipsis, NButton, NInput } from "naive-ui";
import {
  Camera,
  Schematics,
  Cube,
  ModelAlt,
  HeatMap,
  Folder,
  Light,
  Soccer,
  Draw,
  FloatingIp,
  Network1,
  Image,
  LocationHeart,
  LocationCompany,
  View,
  ViewOff,
  TrashCan,
  Renew,
  GroupObjects,
  UngroupObjects
} from '@vicons/carbon';
import { Object3D, Group, Box3, Vector3, Matrix4 } from "three";
import { t } from "@/language";
import { App, Hooks, MoveObjectCommand, RemoveObjectCommand, AddObjectCommand, MultiCmdsCommand, SetValueCommand, SetPositionCommand, Utils } from "@astral3d/engine";
import { escapeHTML, findSiblingsAndIndex } from "@/utils/common/utils";
import { getMaterialName } from "@/utils/common/scenes";
import EsContextmenu from "@/components/es/EsContextmenu.vue";

const sceneTreeRef = ref();
const pattern = ref("");
const sceneTreeData = ref<TreeOption[]>([
  {
    label: window.$cpt("core.editor['Default Camera']"),
    key: 0,
    isLeaf: true,
    disabled: false,
    prefix: getPrefixIcon("PerspectiveCamera"),
  },
  {
    label: window.$cpt("core.editor['Default Scene']"),
    key: 1,
    isLeaf: true,
    disabled: false,
    prefix: getPrefixIcon("Scene"),
  }
]);
/** 树节点高亮 / 与视口模型选中同步（单选） */
const sceneTreeSelected = ref<Array<string | number>>([]);
/** 复选框勾选，仅用于成组/拆组，与模型选中独立 */
const sceneTreeChecked = ref<Array<string | number>>([]);
const sceneTreeExpandedKeys = ref<number[]>([]);
const editEnabled = ref(false);
const canGroupObjects = ref(false);
const canUngroupObjects = ref(false);

function canShowNodeActions(object3D) {
  return editEnabled.value && object3D && object3D !== App.camera && object3D !== App.scene;
}

function getObjectByTreeKey(key: string | number): Object3D | null {
  const id = Number(key);
  if (!Number.isFinite(id)) return null;
  if (App.camera?.id === id) return App.camera;
  return App.scene.getObjectById(id) ?? null;
}

function getCheckedEditableObjects(): Object3D[] {
  return sceneTreeChecked.value
    .map(getObjectByTreeKey)
    .filter((obj): obj is Object3D => {
      if (!obj) return false;
      if (obj === App.camera || obj === App.scene) return false;
      if (obj.ignore) return false;
      return true;
    });
}

function isGroupObject(object: Object3D): boolean {
  return object.type === "Group" || (object as Group).isGroup === true;
}

function updateGroupActionState() {
  const checked = getCheckedEditableObjects();

  const nextCanGroup =
    checked.length >= 2 &&
    checked.every(obj => obj.parent !== null) &&
    checked.every(obj => obj.parent === checked[0].parent);

  const nextCanUngroup =
    checked.length >= 1 &&
    checked.every(obj => isGroupObject(obj) && obj.parent !== null);

  const changed =
    nextCanGroup !== canGroupObjects.value || nextCanUngroup !== canUngroupObjects.value;

  canGroupObjects.value = nextCanGroup;
  canUngroupObjects.value = nextCanUngroup;

  // suffix 按钮 disabled 依赖上述状态，需触发树节点重渲染
  if (changed && sceneTreeData.value.length > 0) {
    sceneTreeData.value = [...sceneTreeData.value];
  }
}

function toggleVisible(object3D) {
  App.execute(new SetValueCommand(object3D, "visible", !object3D.visible));
  refreshUI();
}

function confirmDelete(object3D) {
  window.$dialog.warning({
    title: t("other.Tips"),
    content: t("prompt['Are you sure you want to delete it?']"),
    positiveText: t("other.Ok"),
    negativeText: t("other.Cancel"),
    onPositiveClick: () => {
      if (object3D.parent !== null) {
        App.execute(new RemoveObjectCommand(object3D));
      }
    },
  });
}

function getCameraResetSuffix(disabled = false) {
  return () =>
    h("div", { class: "scene-tree-node-suffix flex items-center ml-auto" }, [
      h(
        NButton,
        {
          quaternary: true,
          circle: true,
          size: "tiny",
          disabled,
          title: t("layout.sider.scene['Reset camera']"),
          onClick: (event: Event) => {
            event.stopPropagation();
            resetDefaultCamera();
          },
        },
        {
          icon: () =>
            h(NIcon, { size: 14 }, {
              default: () => h(Renew),
            }),
        }
      ),
    ]);
}

function getSceneGroupSuffix(disabled = false) {
  return () =>
    h("div", { class: "scene-tree-node-suffix flex items-center ml-auto" }, [
      h(
        NButton,
        {
          quaternary: true,
          circle: true,
          size: "tiny",
          disabled: disabled || !editEnabled.value || !canGroupObjects.value,
          title: t("layout.sider.scene.Group"),
          onClick: (event: Event) => {
            event.stopPropagation();
            confirmGroupObjects();
          },
        },
        {
          icon: () =>
            h(NIcon, { size: 14 }, {
              default: () => h(GroupObjects),
            }),
        }
      ),
      h(
        NButton,
        {
          quaternary: true,
          circle: true,
          size: "tiny",
          disabled: disabled || !editEnabled.value || !canUngroupObjects.value,
          title: t("layout.sider.scene.Ungroup"),
          onClick: (event: Event) => {
            event.stopPropagation();
            confirmUngroupObjects();
          },
        },
        {
          icon: () =>
            h(NIcon, { size: 14 }, {
              default: () => h(UngroupObjects),
            }),
        }
      ),
    ]);
}

function resetDefaultCamera() {
  if (!window.viewer?.modules?.cameraManage) return;

  window.viewer.modules.cameraManage.resetToDefault(true);
  App.config.setKey("camera.navigationMode", "orbit");
  App.setViewportCamera(App.camera.uuid);
  Hooks.useDispatchSignal("cameraChanged", App.camera, window.viewer.modules.controls);
  refreshUI();
}

function confirmGroupObjects() {
  updateGroupActionState();
  if (!canGroupObjects.value) {
    window.$message?.warning(t("layout.sider.scene['Please select sibling objects to group']"));
    return;
  }

  const groupName = ref("Group");
  const status = ref<"error" | undefined>(undefined);

  window.$dialog.warning({
    title: t("layout.sider.scene.Group"),
    content: () =>
      h("div", { class: "flex flex-col gap-8px" }, [
        h("div", t("layout.sider.scene['Group selected objects?']")),
        h(NInput, {
          value: groupName.value,
          placeholder: t("layout.sider.scene['Group Name']"),
          clearable: true,
          size: "small",
          status: status.value,
          onUpdateValue: (value: string) => {
            groupName.value = value;
            status.value = value.trim() ? undefined : "error";
          },
        }),
      ]),
    positiveText: t("other.Ok"),
    negativeText: t("other.Cancel"),
    onPositiveClick: () => {
      if (!groupName.value.trim()) {
        status.value = "error";
        return false;
      }
      groupSelectedObjects(groupName.value.trim());
    },
  });
}

function groupSelectedObjects(name: string) {
  const checked = getCheckedEditableObjects();
  if (checked.length < 2) return;

  const parent = checked[0].parent;
  if (!parent || !checked.every(obj => obj.parent === parent)) return;

  const sorted = [...checked].sort(
    (a, b) => parent.children.indexOf(a) - parent.children.indexOf(b)
  );
  const insertIndex = Math.min(...sorted.map(obj => parent.children.indexOf(obj)));

  // 组原点放在勾选对象包围盒中心，避免变换器落在世界原点
  const box = new Box3();
  for (const obj of sorted) {
    box.expandByObject(obj);
  }
  const centerWorld = box.getCenter(new Vector3());
  const centerLocal = centerWorld.clone();
  parent.worldToLocal(centerLocal);

  const group = new Group();
  group.name = name;
  group.position.copy(centerLocal);

  // 预计算：成组后子物体在组局部空间中的位置（保持世界坐标不变）
  parent.updateWorldMatrix(true, true);
  const groupMatrixWorld = parent.matrixWorld.clone().multiply(
    new Matrix4().makeTranslation(centerLocal.x, centerLocal.y, centerLocal.z)
  );
  const invGroupWorld = groupMatrixWorld.clone().invert();

  const commands: Array<AddObjectCommand | MoveObjectCommand | SetPositionCommand> = [
    new AddObjectCommand(group, parent, insertIndex),
  ];

  for (const obj of sorted) {
    const worldPos = new Vector3();
    obj.getWorldPosition(worldPos);
    const localInGroup = worldPos.clone().applyMatrix4(invGroupWorld);
    commands.push(new MoveObjectCommand(obj, group, undefined));
    commands.push(new SetPositionCommand(obj, localInGroup));
  }

  App.execute(new MultiCmdsCommand(commands, "Group objects"));
  sceneTreeChecked.value = [];
  sceneTreeSelected.value = [group.id];
  refreshUI();
}

function confirmUngroupObjects() {
  updateGroupActionState();
  if (!canUngroupObjects.value) {
    window.$message?.warning(t("layout.sider.scene['Please select groups to ungroup']"));
    return;
  }

  window.$dialog.warning({
    title: t("layout.sider.scene.Ungroup"),
    content: t("layout.sider.scene['Ungroup selected groups?']"),
    positiveText: t("other.Ok"),
    negativeText: t("other.Cancel"),
    onPositiveClick: () => {
      ungroupSelectedObjects();
    },
  });
}

function ungroupSelectedObjects() {
  const groups = getCheckedEditableObjects().filter(isGroupObject);
  if (groups.length === 0) return;

  const commands: Array<MoveObjectCommand | RemoveObjectCommand | SetPositionCommand> = [];
  const promotedIds: number[] = [];

  for (const group of groups) {
    const parent = group.parent;
    if (!parent) continue;

    parent.updateWorldMatrix(true, true);
    group.updateWorldMatrix(true, true);

    const children = [...group.children];
    for (const child of children) {
      const worldPos = new Vector3();
      child.getWorldPosition(worldPos);
      const localInParent = worldPos.clone();
      parent.worldToLocal(localInParent);

      commands.push(new MoveObjectCommand(child, parent, group));
      commands.push(new SetPositionCommand(child, localInParent));
      promotedIds.push(child.id);
    }
    commands.push(new RemoveObjectCommand(group));
  }

  if (commands.length === 0) return;

  App.execute(new MultiCmdsCommand(commands, "Ungroup objects"));
  sceneTreeChecked.value = [];
  if (promotedIds.length > 0) {
    sceneTreeSelected.value = [promotedIds[0]];
    App.selectById(promotedIds[0]);
  } else {
    sceneTreeSelected.value = [];
    App.deselect();
  }
  refreshUI();
}

function getMeshInfoSuffix(geometry, material) {
  return h("div", { class: "scene-tree-node-meta ml-4 text-12px flex items-center" }, [
    h(NBadge, { dot: true, type: "success" }, {}),
    h(NEllipsis, { class: "!max-w-100px" }, {
      default: () => h("span", { class: "ml-1 mr-2" }, { default: () => escapeHTML(geometry.name) }),
    }),
    h(NBadge, { dot: true, type: "warning" }, {}),
    h(NEllipsis, { class: "!max-w-100px" }, {
      default: () => h("span", { class: "ml-1 mr-2" }, { default: () => escapeHTML(getMaterialName(material)) }),
    }),
  ]);
}

function getNodeActionIcons(object3D, disabled = false) {
  if (!canShowNodeActions(object3D)) return null;

  return h("div", { class: "scene-tree-node-actions flex items-center gap-0" }, [
    h(
      NButton,
      {
        quaternary: true,
        circle: true,
        size: "tiny",
        disabled,
        title: object3D.visible ? t("layout.sider.scene.Hide") : t("layout.sider.scene.Show"),
        onClick: (event: Event) => {
          event.stopPropagation();
          toggleVisible(object3D);
        },
      },
      {
        icon: () =>
          h(NIcon, { size: 14 }, {
            default: () => h(object3D.visible ? View : ViewOff),
          }),
      }
    ),
    h(
      NButton,
      {
        quaternary: true,
        circle: true,
        size: "tiny",
        disabled,
        title: t("home.Delete"),
        onClick: (event: Event) => {
          event.stopPropagation();
          confirmDelete(object3D);
        },
      },
      {
        icon: () =>
          h(NIcon, { size: 14 }, {
            default: () => h(TrashCan),
          }),
      }
    ),
  ]);
}

function getNodeSuffix(object3D, disabled = false) {
  const children: any[] = [];

  if (object3D.isMesh) {
    children.push(getMeshInfoSuffix(object3D.geometry, object3D.material));
  }

  const actionIcons = getNodeActionIcons(object3D, disabled);
  if (actionIcons) {
    children.push(actionIcons);
  }

  if (children.length === 0) return undefined;

  return () =>
    h("div", { class: "scene-tree-node-suffix flex items-center ml-auto" }, children);
}

function objectSelected(object) {
  if (object !== null && object.parent !== null) {
    sceneTreeSelected.value = [object.id];
    // 将此id父级递归展开
    sceneTreeExpandedKeys.value = [App.scene.id];

    function getParentId(obj) {
      if (obj.parent.id !== App.scene.id) {
        sceneTreeExpandedKeys.value.push(obj.parent.id);
        getParentId(obj.parent);
      }
    }

    getParentId(object)

    //在虚拟滚动模式下滚动到某个节点
    sceneTreeRef.value?.scrollTo({ key: object.id })
  } else {
    sceneTreeSelected.value = [];
  }
}

// 更新树
function refreshUI() {
  const camera = App.camera;
  const scene = App.scene;

  const _sceneTreeData: any = [];
  _sceneTreeData.push({
    label: window.$cpt("core.editor['Default Camera']"),
    key: camera.id,
    isLeaf: true,
    disabled: (App.locked && App.locked.uuid !== camera.uuid),
    checkboxDisabled: true,
    prefix: getPrefixIcon(camera.type),
    suffix: getCameraResetSuffix(Boolean(App.locked && App.locked.uuid !== camera.uuid)),
  });

  const sceneDisabled = (App.locked && App.locked.uuid !== scene.uuid) as boolean;
  _sceneTreeData.push({
    label: window.$cpt("core.editor['Default Scene']"),
    key: scene.id,
    isLeaf: false,
    disabled: sceneDisabled,
    checkboxDisabled: true,
    prefix: getPrefixIcon(scene.type),
    children: addObjects(scene, sceneDisabled),
    suffix: getSceneGroupSuffix(sceneDisabled),
  });

  if (sceneTreeExpandedKeys.value.length === 0) {
    sceneTreeExpandedKeys.value = [scene.id];
  }

  function getTreeData(object3D, disabled = true) {
    const data: TreeOption = {
      label: escapeHTML(object3D.name),
      key: object3D.id,
      isLeaf: object3D.children.length === 0,
      disabled: App.locked ? disabled : false,
      prefix: getPrefixIcon(object3D.type),
    }
    if (!data.isLeaf) {
      data.children = addObjects(object3D, disabled);
    }

    data.suffix = getNodeSuffix(object3D, disabled);

    return data;
  }

  function addObjects(object3D, disabled = true) {
    const childArr: TreeOption[] = [];

    if (object3D.ignore) return childArr;

    //for循环 为大场景提升遍历效率
    for (let i = 0, l = object3D.children.length; i < l; i++) {
      let _disabled = disabled;

      const child = object3D.children[i];

      if (child.ignore) continue;

      if (_disabled) {
        _disabled = (App.locked && App.locked.uuid !== child.uuid) as boolean;
      }

      childArr.push(getTreeData(child, _disabled));
    }

    return childArr;
  }

  // 模型选中：与 App.selected 同步
  if (App.selected !== null) {
    sceneTreeSelected.value = [App.selected.id];
  } else {
    sceneTreeSelected.value = [];
  }

  // 复选勾选：仅清理已删除节点，不与模型选中耦合
  sceneTreeChecked.value = sceneTreeChecked.value.filter(key => {
    const obj = getObjectByTreeKey(key);
    return obj !== null && obj !== App.camera && obj !== App.scene;
  });

  sceneTreeData.value = _sceneTreeData;
  updateGroupActionState();
}

// 获取节点前缀图标
function getPrefixIcon(type: string) {
  const getIconRender = (icon: any) => {
    return h(
      NIcon,
      { size: 16 },
      { default: () => h(icon) }
    )
  }

  switch (type) {
    case "PerspectiveCamera":
    case "OrthographicCamera":
      return () => getIconRender(Camera);
    case "Light":
    case "AmbientLight":
    case "DirectionalLight":
    case "HemisphereLight":
    case "PointLight":
    case "SpotLight":
    case "RectAreaLight":
      return () => getIconRender(Light);
    case "Scene":
      return () => getIconRender(Schematics);
    case "Group":
      return () => getIconRender(Folder);
    case "Mesh":
    case "SkinnedMesh":
      return () => getIconRender(Cube);
    case "BatchedMesh":
    case "InstancedMesh":
      return () => getIconRender(ModelAlt);
    case "Line":
    case "LineLoop":
    case "LineSegments":
      return () => getIconRender(Draw);
    case "Points":
      return () => getIconRender(Network1);
    case "Bone":
      return () => getIconRender(FloatingIp);
    case "Skeleton":
      return () => getIconRender(Soccer);
    case 'Sprite':
      return () => getIconRender(Image);
    case "Particle":
      return () => getIconRender(HeatMap);
    case "Billboard":
      return () => getIconRender(LocationHeart);
    case "HtmlPanel":
    case "HtmlSprite":
      return () => getIconRender(LocationCompany);
    default:
      return () => getIconRender(Cube);
  }
}

//移动模型
function moveObject(object, newParent, nextObject) {
  if (nextObject === null) nextObject = undefined;

  let newParentIsChild = false;

  object.traverse(function (child) {
    if (child === newParent) newParentIsChild = true;
  });

  if (newParentIsChild) return;

  App.execute(new MoveObjectCommand(object, newParent, nextObject));
}

/**
 * 处理树节点拖动
 * @param node 拖动到的目标位置节点
 * @param dragNode 被拖动的节点
 * @param dropPosition 拖动到的相对于目标节点的位置
 */
function handleSceneTreeDrop({ node, dragNode, dropPosition }: TreeDropInfo) {
  //无法移动到默认场景之外
  if (node.label === window.$t("core.editor['Default Camera']") || node.label === window.$t("core.editor['Default Scene']")) return;
  // 要拖动到的目标模型
  const targetParentObject3D = App.scene.getObjectById(Number(node.key));
  if (!targetParentObject3D) return;
  // 被拖动的模型
  const dragObject3D = App.scene.getObjectById(Number(dragNode.key));

  const [dragNodeSiblings, dragNodeIndex] = findSiblingsAndIndex(dragNode, sceneTreeData.value);
  if (dragNodeSiblings === null || dragNodeIndex === null) return;
  //在被拖动节点的父级中删除该节点
  dragNodeSiblings.splice(dragNodeIndex, 1);

  switch (dropPosition) {
    case "inside":
      if (node.children) {
        node.children.unshift(dragNode)
      } else {
        node.children = [dragNode];
        node.isLeaf = false;
      }
      // 移动模型
      moveObject(dragObject3D, targetParentObject3D, null);
      break;
    case "before":
      // 寻找目标位置节点的父级及该节点的索引
      const [_nodeSiblings, _nodeIndex] = findSiblingsAndIndex(node, sceneTreeData.value);
      if (_nodeSiblings === null || _nodeIndex === null) return;
      _nodeSiblings.splice(_nodeIndex, 0, dragNode);
      // 移动模型
      moveObject(dragObject3D, targetParentObject3D.parent, targetParentObject3D);
      break;
    case "after":
      const [nodeSiblings, nodeIndex] = findSiblingsAndIndex(node, sceneTreeData.value);
      if (nodeSiblings === null || nodeIndex === null) return
      nodeSiblings.splice(nodeIndex + 1, 0, dragNode);
      // 移动模型
      moveObject(dragObject3D, targetParentObject3D.parent, targetParentObject3D.parent?.children[targetParentObject3D.parent?.children.indexOf(targetParentObject3D) + 1]);
      break;
  }

  sceneTreeData.value = Array.from(sceneTreeData.value);
}

// 判断树节点是否可拖动到对应选择位置（拖动到内部时只能是Group / Scene）
function allowDrop({ dropPosition, node }) {
  if (dropPosition === "inside") {
    // 要拖动到的目标模型
    const targetParentObject3D = App.scene.getObjectById(Number(node.key));

    if (targetParentObject3D?.type !== "Group" && targetParentObject3D?.type !== "Scene") {
      return false
    }
  }

  return true;
}

// 树节点高亮选中 → 视口模型选中（与复选框独立）
function handlerTreeSelectChange(keys: Array<number | string>, _: Array<TreeOption>, meta: {
  node: TreeOption,
  action: 'select' | 'unselect'
}) {
  if (meta.action === "select" && meta.node?.key != null) {
    const id = Number(meta.node.key);
    if (id === App.camera?.id || id === App.scene?.id) {
      sceneTreeSelected.value = [];
      App.deselect();
      return;
    }
    sceneTreeSelected.value = [id];
    App.selectById(id);
    return;
  }

  sceneTreeSelected.value = [];
  App.deselect();
}

// 复选框勾选 → 仅更新成组/拆组状态，不改动模型选中
function handlerTreeCheckChange(keys: Array<string | number>) {
  sceneTreeChecked.value = keys.filter(key => {
    const id = Number(key);
    return id !== App.camera?.id && id !== App.scene?.id;
  });
  updateGroupActionState();
}

// 场景树节点点击事件，主要用于配合右键菜单
function nodeProps({ option }: { option: TreeOption }) {
  return {
    class: option.checkboxDisabled ? "scene-tree-node--no-checkbox" : undefined,
    onContextmenu(e: MouseEvent): void {
      e.preventDefault();
      if ([App.camera.id, App.scene.id].includes(option.key as number)) return;

      contextmenuRef.value?.show(e.clientX, e.clientY);

      contextmenuTreeOption.value = option;
    }
  }
}

/* 右键菜单 */
const contextmenuRef = ref();
const contextmenuOptions = [
  {
    label: t("other.Focus"),
    key: 'focus'
  }
];
const contextmenuTreeOption = ref<TreeOption | null>(null);

function handleContextmenuSelect(key: string) {
  if (!contextmenuTreeOption) return;

  const object = App.scene.getObjectById(contextmenuTreeOption.value?.key as number);

  if (!object) return;

  switch (key) {
    case "focus":
      App.focus(object);
      break;
    case "delete":
      const parent = object.parent;
      if (parent !== null) App.execute(new RemoveObjectCommand(object));
      break;
    case "clone":
      const _object = object.clone();

      App.execute(new AddObjectCommand(_object));
      break;
    case "grounding":
      const dy = Utils.distanceToGround(object);
      const newPosition = object.position.clone();
      newPosition.y -= dy;
      App.execute(new SetPositionCommand(object, newPosition));
  }
}

onMounted(async () => {
  // 此signal必须在nextTick方法前注册，否则会造成viewer中已分发此处却尚未监听
  Hooks.useAddOnceSignal("viewerInitCompleted", (viewer) => {
    editEnabled.value = !!viewer.edit?.enabled;
    if (viewer.edit?.enabled) {
      contextmenuOptions.push({
        label: t("home.Delete"),
        key: 'delete'
      }, {
        label: t("layout.header.Clone"),
        key: 'clone'
      }, {
        label: t("layout.header.ClingFround"),
        key: 'grounding'
      })
    }
  });

  await nextTick();
  refreshUI();

  Hooks.useAddSignal("sceneCleared", refreshUI);
  Hooks.useAddSignal("sceneTreeChange", refreshUI);
  Hooks.useAddSignal("objectAdded", refreshUI);
  Hooks.useAddSignal("objectRemoved", refreshUI);
  Hooks.useAddSignal("objectSelected", objectSelected);
  Hooks.useAddSignal("objectLocked", refreshUI);
  Hooks.useAddSignal("objectUnlocked", refreshUI);
})

onBeforeUnmount(() => {
  Hooks.useRemoveSignal("sceneCleared", refreshUI);
  Hooks.useRemoveSignal("sceneTreeChange", refreshUI);
  Hooks.useRemoveSignal("objectAdded", refreshUI);
  Hooks.useRemoveSignal("objectRemoved", refreshUI);
  Hooks.useRemoveSignal("objectSelected", objectSelected);
  Hooks.useRemoveSignal("objectLocked", refreshUI);
  Hooks.useRemoveSignal("objectUnlocked", refreshUI);
})
</script>

<template>
  <n-input v-model:value="pattern" :placeholder="t('layout.sider.scene.Search')" />
  <n-tree
    ref="sceneTreeRef"
    virtual-scroll
    checkable
    :cascade="false"
    :check-on-click="false"
    :pattern="pattern"
    :data="sceneTreeData"
    v-model:selected-keys="sceneTreeSelected"
    v-model:checked-keys="sceneTreeChecked"
    :show-irrelevant-nodes="false"
    v-model:expanded-keys="sceneTreeExpandedKeys"
    draggable
    :allow-drop="allowDrop"
    :node-props="nodeProps"
    @drop="handleSceneTreeDrop"
    @update:selected-keys="handlerTreeSelectChange"
    @update:checked-keys="handlerTreeCheckChange"
    block-line
  />

  <EsContextmenu ref="contextmenuRef" placement="right-start" trigger="manual" size="small"
    :options="contextmenuOptions" @select="handleContextmenuSelect" />
</template>

<style lang="less" scoped>
.n-input {
  margin-bottom: 10px;
  height: 34px;
}

.n-tree {
  height: calc(100% - 44px);
  width: 100%;
  overflow-x: auto;

  :deep(.n-tree-node-wrapper) {
    white-space: nowrap;
  }

  :deep(.n-tree-node-content__text) {
    flex-grow: unset;
  }

  :deep(.n-tree-node-content) {
    width: 100%;
  }

  :deep(.n-tree-node-content__suffix) {
    margin-left: auto;
    flex-shrink: 0;
  }

  /* 默认相机 / 默认场景：不展示复选框 */
  :deep(.scene-tree-node--no-checkbox .n-tree-node-checkbox) {
    display: none;
  }

  .scene-tree-node-suffix {
    gap: 4px;
  }

  .scene-tree-node-actions {
    flex-shrink: 0;
  }
}
</style>
