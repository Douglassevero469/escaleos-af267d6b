import AnimatedShaderBackground from "@/components/ui/animated-shader-background";
import escaleLogoWhite from "@/assets/escale-logo-white.png";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[hsl(240,20%,4%)]">
      <AnimatedShaderBackground />

      <div className="relative z-10 flex flex-col items-center gap-8 animate-fade-in-up text-center max-w-3xl">
        <img src={escaleLogoWhite} alt="Escale" className="h-12 md:h-16" />

        <h1 className="font-montserrat font-bold text-3xl md:text-5xl lg:text-6xl text-white leading-tight tracking-tight">
          Estrutura, estratégia e tecnologia para sua empresa{" "}
          <span className="gradient-text">escalar de verdade.</span>
        </h1>
      </div>
    </div>
  );
}
