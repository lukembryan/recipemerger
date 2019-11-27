<template>
  <div class="browse content">
    <recipe-masonry layout="full-width" />
  </div>
</template>

<script>
import recipeMasonry from '@/components/recipe-masonry.vue';

export default {
  name: 'browse',
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
  grid-template-columns: 100%;
  > .recipe-masonry {
    grid-row-start: 1;
    > .grid-layout {
      border-top: 5px solid #eee;
    }
  }
}
</style>
