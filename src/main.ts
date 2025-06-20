import './style.css'
import * as THREE from 'three'

// Create scene, camera, and renderer
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x0a0a0a)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

// Add renderer to DOM
document.querySelector<HTMLDivElement>('#app')!.appendChild(renderer.domElement)

// Create a beautiful gradient material
const geometry = new THREE.BoxGeometry(2, 2, 2)
const material = new THREE.MeshPhongMaterial({ 
  color: 0x00ff88,
  shininess: 100,
  transparent: true,
  opacity: 0.9
})
const cube = new THREE.Mesh(geometry, material)
cube.castShadow = true
scene.add(cube)

// Add a ground plane
const planeGeometry = new THREE.PlaneGeometry(20, 20)
const planeMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 })
const plane = new THREE.Mesh(planeGeometry, planeMaterial)
plane.rotation.x = -Math.PI / 2
plane.position.y = -2
plane.receiveShadow = true
scene.add(plane)

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x404040, 0.3)
scene.add(ambientLight)

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(5, 5, 5)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 2048
directionalLight.shadow.mapSize.height = 2048
scene.add(directionalLight)

// Add point light for dramatic effect
const pointLight = new THREE.PointLight(0x00ffff, 0.5, 100)
pointLight.position.set(-5, 5, -5)
scene.add(pointLight)

// Position camera
camera.position.z = 5
camera.position.y = 2

// Mouse interaction
let mouseX = 0
let mouseY = 0
let targetRotationX = 0
let targetRotationY = 0

document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1
  
  targetRotationX = mouseY * 0.5
  targetRotationY = mouseX * 0.5
})

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// Animation loop
function animate() {
  requestAnimationFrame(animate)

  // Smooth rotation based on mouse position
  cube.rotation.x += (targetRotationX - cube.rotation.x) * 0.05
  cube.rotation.y += (targetRotationY - cube.rotation.y) * 0.05
  
  // Continuous rotation
  cube.rotation.x += 0.01
  cube.rotation.y += 0.01

  // Animate the point light
  const time = Date.now() * 0.001
  pointLight.position.x = Math.cos(time) * 5
  pointLight.position.z = Math.sin(time) * 5

  renderer.render(scene, camera)
}

animate()

// Add some UI text
const info = document.createElement('div')
info.style.position = 'absolute'
info.style.top = '10px'
info.style.left = '10px'
info.style.color = 'white'
info.style.fontFamily = 'Arial, sans-serif'
info.style.fontSize = '16px'
info.style.pointerEvents = 'none'
info.innerHTML = `
  <h1 style="margin: 0 0 10px 0; color: #00ff88;">SaoHouse 3D</h1>
  <p style="margin: 0;">Move your mouse to interact with the cube</p>
  <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.7;">Built with Vite + Three.js</p>
`
document.body.appendChild(info)
