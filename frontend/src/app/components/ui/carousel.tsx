"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "./utils";
import { Button } from "./button";

type CarouselApi = {
  scrollPrev: () => void;
  scrollNext: () => void;
};

type CarouselProps = {
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  orientation: "horizontal" | "vertical";
  scrollPrev: () => void;
  scrollNext: () => void;
};

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

function Carousel({
  orientation = "horizontal",
  setApi,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);

  const scrollByPage = React.useCallback((direction: -1 | 1) => {
    const root = rootRef.current;
    if (!root) return;
    const viewport = root.querySelector<HTMLElement>("[data-slot='carousel-content']");
    viewport?.scrollBy({
      left: orientation === "horizontal" ? direction * viewport.clientWidth : 0,
      top: orientation === "vertical" ? direction * viewport.clientHeight : 0,
      behavior: "smooth",
    });
  }, [orientation]);

  const scrollPrev = React.useCallback(() => scrollByPage(-1), [scrollByPage]);
  const scrollNext = React.useCallback(() => scrollByPage(1), [scrollByPage]);

  React.useEffect(() => {
    setApi?.({ scrollPrev, scrollNext });
  }, [scrollNext, scrollPrev, setApi]);

  return (
    <CarouselContext.Provider value={{ orientation, scrollPrev, scrollNext }}>
      <div
        ref={rootRef}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useCarousel();

  return (
    <div
      className={cn(
        "flex snap-mandatory overflow-auto",
        orientation === "horizontal" ? "snap-x" : "snap-y flex-col",
        className,
      )}
      data-slot="carousel-content"
      {...props}
    />
  );
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn("min-w-0 shrink-0 grow-0 basis-full snap-start", className)}
      {...props}
    />
  );
}

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev } = useCarousel();

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "top-1/2 -left-12 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext } = useCarousel();

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "top-1/2 -right-12 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight />
      <span className="sr-only">Next slide</span>
    </Button>
  );
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
