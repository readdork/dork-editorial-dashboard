const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || ''
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ''

export const cloudinaryApi = {
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )
    
    if (!response.ok) {
      throw new Error('Failed to upload image to Cloudinary')
    }
    
    const data = await response.json()
    return data.secure_url
  },

  getOptimizedUrl(url: string, options: { width?: number; height?: number; crop?: string } = {}): string {
    if (!url.includes('cloudinary.com')) return url
    
    const { width, height, crop = 'fill' } = options
    let transformations = ''
    
    if (width) transformations += `,w_${width}`
    if (height) transformations += `,h_${height}`
    if (crop) transformations += `,c_${crop}`
    
    if (transformations) {
      return url.replace('/upload/', `//upload/q_auto,f_auto${transformations}/`)
    }
    
    return url.replace('/upload/', '/upload/q_auto,f_auto/')
  }
}
