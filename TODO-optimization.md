# Tiny World Optimization TODO

## Remaining from Three.js/WebGL Research

### Priority 1 — Quick Wins
- [x] **Object Pooling** — Rain already uses InstancedMesh with wrapping (no create/destroy)
- [x] **ShaderGrass** — Wind animation moved to vertex shader (no per-frame JS loops for ~3000 blades)

### Priority 2 — Medium Effort
- [ ] **BatchedMesh** — Could combine static flora but animated parts complicate this
- [x] **Shader wind for stems** — Done via ShaderGrass; flowers have multi-part geometry (stem+center+petals), shader approach would need merged geometry or GPGPU

### Priority 3 — Big Refactor  
- [ ] **GPGPU creatures** — Move creature AI (state machine, movement, energy) to GPU compute
  - Requires: GPUComputationRenderer setup
  - Store creature state in data texture (pos, vel, state, timer, energy)
  - Write GLSL compute shader for AI logic
  - Read positions for rendering
  - Estimate: 2-3 hours

---

## Progress Log

### 2026-01-29
- Rain already pooled ✓
- ShaderGrass implemented — wind via vertex shader, ~3000 instances, 0 per-frame matrix updates
- Flower shader attempted but multi-part geometry makes it complex (deferred to GPGPU)
