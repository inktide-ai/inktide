export function inferModelType(fileName: string, contentType?: string): 'vrm' | 'glb' {
  if (fileName.endsWith('.vrm')) return 'vrm'
  if (contentType === 'model/gltf-binary' || fileName.endsWith('.glb')) return 'glb'
  return 'glb'
}
