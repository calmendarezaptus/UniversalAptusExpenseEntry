import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      locale={es}
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-3 [--cell-size:2rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("es", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-full", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-3", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 h-10 flex w-full items-center justify-between px-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 bg-transparent select-none p-0 aria-disabled:opacity-40 flex items-center justify-center text-white hover:text-white hover:bg-white/25 rounded-full",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 bg-transparent select-none p-0 aria-disabled:opacity-40 flex items-center justify-center text-white hover:text-white hover:bg-white/25 rounded-full",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-10 w-full items-center justify-center px-[--cell-size] rounded-lg bg-gradient-to-r from-theme-from to-theme-to shadow-sm shadow-theme-from/20",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-[--cell-size] w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "bg-popover absolute inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-bold text-white tracking-wide",
          captionLayout === "label"
            ? "text-sm"
            : "[&>svg]:text-white/70 flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex w-full", defaultClassNames.weekdays),
        weekday: cn(
          "text-theme-to/80 w-[--cell-size] flex-1 text-center select-none text-[0.65rem] font-bold uppercase tracking-widest pb-1 border-b border-theme-border",
          defaultClassNames.weekday
        ),
        week: cn("mt-1 flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-[--cell-size] select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-muted-foreground select-none text-[0.8rem]",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative w-[--cell-size] h-[--cell-size] flex-1 select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-full [&:last-child[data-selected=true]_button]:rounded-r-full",
          defaultClassNames.day
        ),
        range_start: cn(
          "bg-theme-light rounded-l-full",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("bg-theme-light rounded-r-full", defaultClassNames.range_end),
        today: cn(
          "bg-theme-light text-theme-from rounded-full font-semibold data-[selected=true]:bg-transparent",
          defaultClassNames.today
        ),
        outside: cn(
          "text-slate-300 opacity-40 aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-30",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn(className, "w-5 h-5")} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn(className, "w-5 h-5")}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn(className, "w-5 h-5")} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-[--cell-size] items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        // Selected: theme gradient circle with shadow
        "data-[selected-single=true]:bg-gradient-to-br data-[selected-single=true]:from-theme-from data-[selected-single=true]:to-theme-to data-[selected-single=true]:text-white data-[selected-single=true]:shadow-md data-[selected-single=true]:shadow-theme-from/30",
        // Range styles
        "data-[range-middle=true]:bg-theme-light data-[range-middle=true]:text-theme-from data-[range-middle=true]:hover:bg-theme-border",
        "data-[range-start=true]:bg-gradient-to-br data-[range-start=true]:from-theme-from data-[range-start=true]:to-theme-to data-[range-start=true]:text-white data-[range-start=true]:shadow-md",
        "data-[range-end=true]:bg-gradient-to-br data-[range-end=true]:from-theme-from data-[range-end=true]:to-theme-to data-[range-end=true]:text-white data-[range-end=true]:shadow-md",
        // Focus ring
        "group-data-[focused=true]/day:border-theme-from group-data-[focused=true]/day:ring-theme-from/50",
        // Layout: full circle shape
        "flex aspect-square h-auto w-full min-w-[--cell-size] flex-col gap-1 font-medium leading-none rounded-full transition-all duration-150",
        // Hover: theme tint
        "hover:bg-theme-light hover:text-theme-from",
        // Range shapes
        "data-[range-end=true]:rounded-full data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-full",
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px]",
        "[&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
