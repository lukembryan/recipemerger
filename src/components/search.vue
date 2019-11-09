<template>
  <div class="search">
    <form>
      <font-awesome-icon :icon="['fal', 'search']" />
      <input type="text" name="search" placeholder="start typing..." />
    </form>
  </div>
</template>

<script>
export default {
  name: 'search',
  props: {}
}
</script>

<style scoped lang="less">
@import '../assets/less/shared.less';

.search {
  form {
    position: relative;
    display: inline-block;
    font-size: 1.6em;
    .screen-xxs-max({
      display: none;
    });
    > svg {
      position: relative;
      font-size: 0.8em;
      vertical-align: top;
      line-height: 1.4;
      top: 5px;
      left: 0;
    }
    > input {
      background-color: transparent;
      border: none;
      padding: 0;
      vertical-align: top;
      margin-top: 0;
      margin-left: 15px;
      height: 30px;
      width: 150px;
      &:focus {
        outline: none;
      }
    }
  }
}
</style>
