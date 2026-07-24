<template>
  <n-form :model="form" label-placement="left" :label-width="120" class="mt-2"
          :style="{ minWidth: '300px' }">
    <n-form-item :label="t('setting.shortcuts.Translate')">
      <n-input v-model:value="form.translate" readonly maxlength="1"
               :placeholder="t('setting.shortcuts.Please press a key')"
               @keyup="shortcutsKeyup($event, 'translate')"/>
    </n-form-item>
    <n-form-item :label="t('setting.shortcuts.Rotate')">
      <n-input v-model:value="form.rotate" readonly maxlength="1"
               :placeholder="t('setting.shortcuts.Please press a key')"
               @keyup="shortcutsKeyup($event, 'rotate')"/>
    </n-form-item>
    <n-form-item :label="t('setting.shortcuts.Scale')">
      <n-input v-model:value="form.scale" readonly maxlength="1"
               :placeholder="t('setting.shortcuts.Please press a key')"
               @keyup="shortcutsKeyup($event, 'scale')"/>
    </n-form-item>
    <n-form-item :label="t('setting.shortcuts.Undo')">
      <n-input v-model:value="form.undo" readonly maxlength="1"
               :placeholder="t('setting.shortcuts.Please press a key')" @keyup="shortcutsKeyup($event, 'undo')"/>
      <EsTip class="ml-1">
        {{
          `${!Utils.IS_MAC ? 'Ctrl' : 'Meta'} + ${form.undo.toUpperCase()} ${t('other.undo')},${!Utils.IS_MAC ? 'Ctrl' : 'Meta'} + Shift + ${form.undo.toUpperCase()} ${t('other.redo')}`
        }}
      </EsTip>
    </n-form-item>
    <n-form-item :label="t('setting.shortcuts.Focus')">
      <n-input v-model:value="form.focus" readonly maxlength="1"
               :placeholder="t('setting.shortcuts.Please press a key')"
               @keyup="shortcutsKeyup($event, 'focus')"/>
    </n-form-item>
    <n-form-item :label="t('setting.shortcuts.Roam Toggle')">
      <n-input v-model:value="form.roamToggle" readonly maxlength="1"
               :placeholder="t('setting.shortcuts.Please press a key')"
               @keyup="shortcutsKeyup($event, 'roamToggle')"/>
      <EsTip class="ml-1">
        ALT + {{ form.roamToggle.toUpperCase() }} {{ t('layout.viewport.toggleNavigationMode') }}
      </EsTip>
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
import {reactive,onMounted} from "vue";
import {t} from "@/language";
import EsTip from "@/components/es/EsTip.vue";
import {App,RemoveObjectCommand,Hooks,Utils} from "@astral3d/engine";

// 由于撤消/重做，目前不能使用z
const form = reactive({
  // shortcuts
  translate: App.config.getShortcutItem('translate'),
  rotate: App.config.getShortcutItem('rotate'),
  scale: App.config.getShortcutItem('scale'),
  undo: App.config.getShortcutItem('undo'),
  focus: App.config.getShortcutItem('focus'),
  roamToggle: App.config.getShortcutItem('roamToggle') || 'm',
})

// 快捷键输入框keyup
const isValidKeyBinding = (key) => key.match(/^[A-Za-z0-9]$/i);
function shortcutsKeyup(event:KeyboardEvent, varName:string) {
  //判断按下的是否是有效的键
  if (!isValidKeyBinding(event.key)) return;
  form[varName] = event.key;
  App.config.setShortcutItem(varName, event.key.toLowerCase());
}

onMounted(() => {
  document.addEventListener("keydown", (event) => {
    // 如果事件目标是输入框（INPUT 或 TEXTAREA），则直接返回
    if (event.target && ['INPUT', 'TEXTAREA'].includes((<HTMLElement>event.target).tagName.toUpperCase())) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case 'delete':
        const object = App.selected;
        if (object === null) return;

        const parent = object.parent;
        if (parent !== null) App.execute(new RemoveObjectCommand(object));
        break;
      case App.config.getShortcutItem('translate'):
        if (window.viewer?.modules?.cameraManage?.getNavigationMode() === 'roam') return;
        Hooks.useDispatchSignal('transformModeChanged', 'translate');
        break;
      case App.config.getShortcutItem('rotate'):
        if (window.viewer?.modules?.cameraManage?.getNavigationMode() === 'roam') return;
        Hooks.useDispatchSignal('transformModeChanged', 'rotate');
        break;
      case App.config.getShortcutItem('scale'):
        Hooks.useDispatchSignal('transformModeChanged', 'scale');
        break;
      case App.config.getShortcutItem('undo'):
        // windows下：ctrl + App.config.getShortcutItem('shortcuts/undo') 撤销，同时按下shift重做
        // mac下：meta + App.config.getShortcutItem('shortcuts/undo') 撤销，同时按下shift重做
        if (Utils.IS_MAC ? event.metaKey : event.ctrlKey) {
          //阻止特定于浏览器的热键
          event.preventDefault();
          if (event.shiftKey) {
            App.redo();
          } else {
            App.undo();
          }
        }
        break;
      case App.config.getShortcutItem('focus'):
        if (App.selected !== null) {
          App.focus(App.selected);
        }
        break;
    }
  })
})
</script>

<style scoped lang="less">
.n-input{
  width: 6rem !important;
  text-align: center;
}
</style>