<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<title>BerlinPuls</title>
</svelte:head>

<div class="min-h-screen bg-gray-900 text-gray-100">
	{@render children()}
</div>
