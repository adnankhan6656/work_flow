<template>
  <div class="h-screen w-full flex items-center justify-center relative">

    <div class="draggable cursor-pointer text-2xl customshadow p-9 rounded-[50%] flex flex-col space-y-2 items-center justify-between">
      <i class="fa-solid fa-play"></i>
      <p>Start</p>
      <div class="flex items-center space-x-2">
        <i class="fa-solid fa-edit cursor-pointer" @click="isStartTask=true"></i>
        <i class="fa-solid fa-trash"></i>
      </div>
    </div>
    
    <div class="startSidebar h-screen overflow-y-scroll w-[20%] flex flex-col justify-center items-center text-2xl font-bold space-y-4 absolute top-0 right-0 p-3 customshadow">
      <div class="task flex items-center space-x-3 cursor-pointer">
        <i class="fa-solid fa-play"></i>
        <p>Start</p>
      </div>
      <div class="task flex items-center space-x-3 cursor-pointer" @click="isEmailTask=true">
        <i class="fa-solid fa-envelope"></i>
        <p>Email</p>
      </div>
      <div class="task flex items-center space-x-3 cursor-pointer">
        <i class="fa-solid fa-diamond-turn-right"></i>
        <p>Redirect Task</p>
      </div>
    </div>

    <div class="startTaskModel min-w-[500px] mx-auto h-[600px] z-10 bg-white overflow-y-scroll absolute top-0 left-[30%] p-12 customshadow" v-if="isStartTask">
      <button class="text-2xl">
        <i class="absolute top-0 right-0 fa-solid fa-xmark cursor-pointer p-11" @click="closeStartTask"></i>
      </button>
      <p class="text-2xl">Add Field</p>
      <select @change="generateFieldDynamic($event)" class="p-3 rounded-lg my-3">
        <option value="" disabled selected>Select Field</option>
        <option value="textField">Text Field</option>
        <option value="numberField">Number Field</option>
      </select>
      <div v-for="(dynamicField, index) in dynamicFields" class="mt-4" :key="index">
        <p>Label :- {{ dynamicField.label }}</p>
        <input class="bg-slate-200 p-3 focus:outline-none text-lg rounded-lg" type="text" v-model="dynamicField.label" :placeholder="dynamicField.label">
        <p>Value</p>
        <input class="bg-slate-200 p-3 focus:outline-none text-lg rounded-lg" :type="dynamicField.type" v-model="dynamicField.value" :placeholder="dynamicField.label">
        <i class="fa-solid fa-minus text-xl cursor-pointer" @click="removeFromDynamics(index)"></i>
      </div>
    </div>

    <div class="emailTaskModel min-w-[500px] mx-auto h-[600px] z-10 bg-white overflow-y-scroll absolute top-0 left-[30%] p-12 customshadow" v-if="isEmailTask">
      <button class="text-2xl">
        <i class="absolute top-0 right-0 fa-solid fa-xmark cursor-pointer p-11" @click="closeEmailTask"></i>
      </button>
      <p class="text-2xl">Email Task</p>
      <div class="mb-4">
        <label for="to" class="block text-lg font-medium">To:</label>
        <input id="to" v-model="to" class="w-full p-2 border rounded-lg">
      </div>
      <div class="mb-4">
        <label for="cc" class="block text-lg font-medium">CC:</label>
        <input id="cc" v-model="cc" class="w-full p-2 border rounded-lg">
      </div>
      <div class="mb-4">
        <label for="from" class="block text-lg font-medium">From:</label>
        <input id="from" v-model="from" class="w-full p-2 border rounded-lg">
      </div>
      <textarea class="bg-slate-200 p-3 focus:outline-none text-lg rounded-lg w-full h-full" v-model="emailContent"></textarea>
      <button @click="replacePlaceholders" class="mt-4 p-3 bg-blue-500 text-white rounded-lg">Replace Placeholders</button>
    </div>

  </div>
</template>
<script setup>
import interact from 'interactjs';
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const isStartTask = ref(false);
const isEmailTask = ref(false);
const emailContent = ref('');
const to = ref('');
const cc = ref('');
const from = ref('');
const dynamicFields = computed(() => store.state.dynamicFields);

interact('.draggable').draggable({
  inertia: true,
  modifiers: [
    interact.modifiers.restrictRect({
      restriction: 'parent',
      endOnly: true,
    }),
  ],
  autoScroll: true,
  onmove: (event) => {
    const target = event.target;
    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    target.style.transform = `translate(${x}px, ${y}px)`;

    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
  },
});
interact(".dropzone").dropzone({
  accept: ".draggable",
  overlap: 0.75,
  ondropactivate: function (event) {
    const item = event.relatedTarget;
    item.classList.add("dragging");
  },
  ondropdeactivate: function (event) {
    const item = event.relatedTarget;
    item.classList.remove("dragging", "cannot-drop", "is-danger");
  },
  ondragenter: function (event) {
    const item = event.relatedTarget;
    item.classList.remove("cannot-drop", "is-danger");
    item.classList.add("can-drop", "is-success");
  },
  ondragleave: function (event) {
    const item = event.relatedTarget;
    item.classList.remove("can-drop", "is-success");
    item.classList.add("cannot-drop", "is-danger");
  }
});

const generateFieldDynamic = (event) => {
  const newField = {
    type: event.target.value === 'textField' ? 'text' : 'number',
    value: '',
    label: '',
  };
  store.commit('setDynamicFields', [...dynamicFields.value, newField]);
};

const removeFromDynamics = (index) => {
  const updatedFields = [...dynamicFields.value];
  updatedFields.splice(index, 1);
  store.commit('setDynamicFields', updatedFields);
};

const closeStartTask = () => {
  dynamicFields.value.forEach((field) => {
    if (field.label === '' || field.value === '') {
      return;
    }
    isStartTask.value = false;
  });
};

const closeEmailTask = () => {
  isEmailTask.value = false;
};

const replacePlaceholders = () => {
  let content = emailContent.value;
  dynamicFields.value.forEach((field) => {
    const placeholder = `{${field.label}}`;
    content = content.split(placeholder).join(field.value);
  });
  emailContent.value = content;
};
</script>
// store.js
import { createStore } from 'vuex';

export default createStore({
  state: {
    dynamicFields: [],
  },
  mutations: {
    setDynamicFields(state, fields) {
      state.dynamicFields = fields;
    },
    updateDynamicField(state, { index, key, value }) {
      state.dynamicFields[index][key] = value;
    },
  },
});

