<script>
	import { beforeUpdate } from "svelte";
    import { add_classes, svg_element } from "svelte/internal";
	import Summary from "./Summary.svelte";

	const PAGE_SIZE = 20;

	export let page;

	let items;
	let offset;

	$: fetch(`https://node-hnapi.herokuapp.com/news?page=${page}`)
		.then(r => r.json())
		.then(data => {
			items = data;
			offset = PAGE_SIZE * (page - 1);
			window.scrollTo(0, 0);
		});
    let select = false;
    if (select == true){
        classList.add(".active")
    }
</script>

{#if items}
	{#each items as item, i}
		<Summary {item} {i} {offset}/>
	{/each}
    
	
    <div>
        <ul class="pagination">
            
                
            
            <li class="waves-effect"><a href="#/top/1">1</a></li>
            <li class="waves-effect"><a href="#/top/2">2</a></li>
            <li class="waves-effect"><a href="#/top/3">3</a></li>
            <li class="waves-effect"><a href="#/top/4">4</a></li>
            <li class="waves-effect"><a href="#/top/5">5</a></li>
            <li class="waves-effect"><a href="#/top/6">6</a></li>
            <li class="waves-effect"><a href="#/top/7">7</a></li>
            <li class="waves-effect"><a href="#/top/8">8</a></li>
            <li class="waves-effect"><a href="#/top/9">9</a></li>
            
            <li class="waves-effect"><a href="#/top/{page + 1}"><span class="material-symbols-outlined">
                arrow_forward_ios
            </span></a></li>
            
                
                
            

        </ul>
            
        
           
        
    </div>
{:else}
    <p>
        Loading
    </p>
{/if}

<style>
	a {
		padding: 2em;
		display: block;
	}

	.loading {
		opacity: 0;
		animation: 0.4s 0.8s forwards fade-in;
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}
</style>