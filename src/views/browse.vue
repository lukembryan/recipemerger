<template>
  <div class="browse content">
    <recipe-masonry />
  </div>
</template>

<script>
import mixins from '@/mixins.js';
import recipeMasonry from '@/components/recipe-masonry.vue';

export default {
  name: 'browse',
  mixins: [mixins],
  components: {
    recipeMasonry
  }
}
</script>

<style lang="less">
.browse {
  grid-column-start: 1;
  display: grid;
  grid-template-rows: 70px auto;
  > .recipe-masonry {
    grid-row-start: 1;
    grid-column-start: 1;
    grid-column-end: 3;
    > .grid-layout {}
  }
}
</style>
