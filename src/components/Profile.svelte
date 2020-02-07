<script>
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'

  let name
  let email
  let thumbnail
  let visible = false

  async function loadData() {
    const length = 27
    let userData = await fetch(`https://randomuser.me/api/`).then(r => r.json())
    console.log(userData.results[0])
    name = `${userData.results[0].name.title} ${userData.results[0].name.first} ${userData.results[0].name.last}`
    email = userData.results[0].email
    name = name.length > length ? name.substring(0, length - 3) + '...' : name
    email =
      email.length > length ? email.substring(0, length - 3) + '...' : email
    thumbnail = userData.results[0].picture.medium
    visible = true
  }

  onMount(loadData)
</script>

<style>
  .columns {
    display: flex;
    padding: 5px;
    margin-top: 5px;
    border: 1px solid #eee;
    border-radius: 5px 5px 5px 5px;
  }
  .columns div div {
    margin-top: 5px;
    margin-left: 7px;
  }
  img {
    box-shadow: 2px 2px 3px #eee;
  }
</style>

{#if visible}
  <div class="columns" transition:fade={{ delay: 250, duration: 300 }}>
    <div>
      <img src={thumbnail} alt="" />
    </div>
    <div>
      <div>{name}</div>
      <div>{email}</div>
    </div>
  </div>
{/if}
