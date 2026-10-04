import type {Metadata,Viewport} from 'next';
import './globals.css';
import './coaching.css';
export const metadata:Metadata={title:'Coaching Mental',description:'Tes notes, tes décisions et tes valeurs dans un espace personnel.',manifest:'/manifest.webmanifest',icons:{icon:'/favicon.svg',apple:'/icons/apple-touch-icon.png'},appleWebApp:{capable:true,statusBarStyle:'default',title:'Coaching Mental'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#f7f4ee'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><body>{children}</body></html>}
