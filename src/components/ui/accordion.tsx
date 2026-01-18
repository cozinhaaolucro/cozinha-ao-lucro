import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const AccordionContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

const Accordion = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    type?: "single" | "multiple"
    collapsible?: boolean
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
  }
>(({ className, type, value: controlledValue, defaultValue, onValueChange, children, ...props }, ref) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")

  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue

  const handleValueChange = (newValue: string) => {
    const nextValue = value === newValue ? "" : newValue
    if (!isControlled) {
      setInternalValue(nextValue)
    }
    onValueChange?.(nextValue)
  }

  return (
    <AccordionContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
})
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => (
  <div
    ref={ref}
    data-value={value}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { value, onValueChange } = React.useContext(AccordionContext)
  // Walk up to find the item value. In a real app we might use context for item too, 
  // but for this compatible replacement we assume Trigger is inside Item.
  // Actually, we need the item value to know if we are open.
  // Let's create an ItemContext to be safe and cleaner.

  return (
    <ItemContext.Consumer>
      {(itemValue) => {
        const isOpen = value === itemValue
        return (
          <h3 className="flex">
            <button
              ref={ref}
              type="button"
              onClick={() => onValueChange?.(itemValue)}
              data-state={isOpen ? "open" : "closed"}
              className={cn(
                "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
                className
              )}
              {...props}
            >
              {children}
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </button>
          </h3>
        )
      }}
    </ItemContext.Consumer>
  )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <ItemContext.Consumer>
    {(itemValue) => {
      const { value } = React.useContext(AccordionContext)
      const isOpen = value === itemValue
      return (
        <div
          ref={ref}
          data-state={isOpen ? "open" : "closed"}
          className="overflow-hidden text-sm data-[state=closed]:grid-rows-[0fr] data-[state=open]:grid-rows-[1fr] grid transition-[grid-template-rows] duration-300 ease-out"
          {...props}
        >
          <div className={cn("pb-4 pt-0 min-h-0", className)}>{children}</div>
        </div>
      )
    }}
  </ItemContext.Consumer>
))
AccordionContent.displayName = "AccordionContent"

// Helper context for Item -> Trigger/Content communication
const ItemContext = React.createContext<string>("")

// Re-wrap Item to provide context
const AccordionItemWrapper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ value, ...props }, ref) => (
  <ItemContext.Provider value={value}>
    <AccordionItem ref={ref} value={value} {...props} />
  </ItemContext.Provider>
))
AccordionItemWrapper.displayName = "AccordionItem"

export { Accordion, AccordionItemWrapper as AccordionItem, AccordionTrigger, AccordionContent }
