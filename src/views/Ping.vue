<template>
  <div>
    <h2>ICMP Ping Results</h2>
    <button @click="startPing">Start Ping</button>
    <table>
      <thead>
        <tr>
          <th>Sequence</th>
          <th>Time (ms)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(result, index) in results" :key="index">
          <td>{{ result.sequence }}</td>
          <td>{{ result.time }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';

const results = ref([]);
let eventSource = null;

const startPing = () => {
  results.value = []; // Clear previous results
  eventSource = new EventSource('http://localhost:4000/icmp-ping?host=192.168.1.1&timeout=1000&count=10');

  eventSource.onmessage = (event) => {
    const data = event.data;
    if (data.includes('Sequence')) {
      const [sequence, time] = data.replace('Ping to 192.168.1.1: ', '').split(', ');
      results.value.push({
        sequence: sequence.replace('Sequence ', ''),
        time: time.replace('Time: ', '').replace('ms', '')
      });
    }
  };

  eventSource.onerror = (error) => {
    console.error('EventSource failed:', error);
    eventSource.close();
  };
};

onBeforeUnmount(() => {
  if (eventSource) {
    eventSource.close();
  }
});
</script>
