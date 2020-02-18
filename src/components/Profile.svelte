<script>
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'

  let name
  let email
  let nameOrg
  let emailOrg
  let thumbnail
  let visible = false
  const maxlength = 27

  const shortenString = (str, maxlength) => {
    return str.length > maxlength
      ? str.substring(0, maxlength - 3) + '...'
      : str
  }

  async function loadData() {
    let userData = await fetch(`https://randomuser.me/api/`).then(r => r.json())
    nameOrg = `${userData.results[0].name.title} ${userData.results[0].name.first} ${userData.results[0].name.last}`
    emailOrg = userData.results[0].email
    name = shortenString(nameOrg, maxlength)
    email = shortenString(emailOrg, maxlength)
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
    margin-top: 2px;
    margin-left: 2px;
    border: 1px solid #bbb;
    box-shadow: 2px 2px 3px #eee;
  }
</style>

{#if visible}
  <div class="columns" transition:fade={{ delay: 250, duration: 300 }}>
    <div>
      <img src={thumbnail} alt="" />
    </div>
    <div>
      <div title={nameOrg}>{name}</div>
      <div title={emailOrg}>{email}</div>
    </div>
  </div>
{/if}
