<script lang="ts">
    export let title: string;
    export let imageSrc: string;
  </script>
  
  <div class="container">
    <h2>{title}</h2>
    <img src={imageSrc} alt="River Bank">
  </div>
  
  <style>
    .container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
  
    img {
      max-width: 100%;
      max-height: 80%;
    }
  </style>