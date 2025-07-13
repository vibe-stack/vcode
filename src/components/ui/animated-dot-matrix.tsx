import React from "react"
import { useState, useEffect, useCallback, useRef } from "react"

interface DotMatrixProps {
  dotSize?: number
  rows?: number
  columns?: number
  baseColor?: string
  fillColor?: string
  fillSpeed?: number // milliseconds for slowest row to fill
  autoFill?: boolean // auto-calculate columns to fill container width
}

export default function DotMatrix({
  dotSize = 8,
  rows = 10,
  columns = 20,
  baseColor = "#e5e7eb",
  fillColor = "#3b82f6",
  fillSpeed = 3000,
  autoFill = false,
}: DotMatrixProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [calculatedColumns, setCalculatedColumns] = useState(columns)
  const [filledDots, setFilledDots] = useState<boolean[][]>(() =>
    Array(rows)
      .fill(null)
      .map(() => Array(calculatedColumns).fill(false)),
  )
  const [isAnimating, setIsAnimating] = useState(false)
  const [isUnrolling, setIsUnrolling] = useState(false)

  // Calculate columns to fill container width
  const calculateColumns = useCallback(() => {
    if (!autoFill || !containerRef.current) return columns

    const containerWidth = containerRef.current.offsetWidth
    const gapSize = 4 // gap-1 in Tailwind is 4px
    const availableWidth = containerWidth - gapSize
    const dotWithGap = dotSize + gapSize
    const calculatedCols = Math.floor(availableWidth / dotWithGap)
    
    return Math.max(1, calculatedCols)
  }, [autoFill, columns, dotSize])

  // Update calculated columns when container size changes
  useEffect(() => {
    if (!autoFill) return

    const updateColumns = () => {
      const newColumns = calculateColumns()
      if (newColumns !== calculatedColumns) {
        setCalculatedColumns(newColumns)
      }
    }

    updateColumns()
    
    const resizeObserver = new ResizeObserver(updateColumns)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [autoFill, calculateColumns, calculatedColumns])

  // Reset matrix when columns change
  useEffect(() => {
    setFilledDots(
      Array(rows)
        .fill(null)
        .map(() => Array(calculatedColumns).fill(false)),
    )
  }, [rows, calculatedColumns])

  const resetMatrix = useCallback(() => {
    setFilledDots(
      Array(rows)
        .fill(null)
        .map(() => Array(calculatedColumns).fill(false)),
    )
    setIsAnimating(false)
    setIsUnrolling(false)
  }, [rows, calculatedColumns])

  const startUnrollAnimation = useCallback(() => {
    setIsUnrolling(true)
    
    // Unroll all columns in sync
    for (let colIndex = calculatedColumns - 1; colIndex >= 0; colIndex--) {
      setTimeout(() => {
        setFilledDots((prev) => {
          const newState = prev.map(row => [...row])
          for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
            newState[rowIndex][colIndex] = false
          }
          return newState
        })
      }, (calculatedColumns - 1 - colIndex) * 20)
    }

    // Start next animation cycle after unroll completes
    setTimeout(() => {
      setIsUnrolling(false)
      setTimeout(() => {
        if (!isAnimating) {
          startAnimation()
        }
      }, 100)
    }, calculatedColumns * 20)
  }, [calculatedColumns, rows, isAnimating])

  const startAnimation = useCallback(() => {
    if (isAnimating || isUnrolling) return

    resetMatrix()
    setIsAnimating(true)

    // Calculate base timing - fillSpeed is now the slowest row
    const fastestInterval = fillSpeed / calculatedColumns / 3 // Fastest row is 3x faster
    const slowestInterval = fillSpeed / calculatedColumns // Slowest row

    // Create random speed multipliers for each row (0.33 to 1.0)
    // 1.0 corresponds to the slowest (fillSpeed), 0.33 to fastest
    const speedMultipliers = Array(rows)
      .fill(null)
      .map(() => 0.33 + Math.random() * 0.67)
    
    // Ensure at least one row has multiplier of 1.0 (slowest speed)
    const guaranteedRowIndex = Math.floor(Math.random() * rows)
    speedMultipliers[guaranteedRowIndex] = 1.0

    let completedRows = 0
    const totalRows = rows

    // Start animation for each row
    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      const rowInterval = slowestInterval * speedMultipliers[rowIndex]

      // Fill this specific row from column 0 to columns-1
      for (let colIndex = 0; colIndex < calculatedColumns; colIndex++) {
        setTimeout(() => {
          setFilledDots((prev) => {
            const newState = [...prev]
            newState[rowIndex] = [...newState[rowIndex]]
            newState[rowIndex][colIndex] = true
            return newState
          })
        }, colIndex * rowInterval)
      }

      // Check if this row is complete
      setTimeout(() => {
        completedRows++
        if (completedRows === totalRows) {
          setIsAnimating(false)
          // Start unroll animation after a brief pause
          setTimeout(() => {
            startUnrollAnimation()
          }, 200)
        }
      }, calculatedColumns * rowInterval)
    }
  }, [rows, calculatedColumns, fillSpeed, isAnimating, isUnrolling, resetMatrix, startUnrollAnimation])

  // Auto-start animation on mount and when props change
  useEffect(() => {
    const timer = setTimeout(startAnimation, 500)
    return () => clearTimeout(timer)
  }, [startAnimation])

  return (
    <div ref={containerRef} className="flex flex-col items-center w-full">
      <div
        className="grid gap-1 rounded-lg"
        style={{
          gridTemplateColumns: `repeat(${calculatedColumns}, ${dotSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${dotSize}px)`,
        }}
      >
        {filledDots.map((row, rowIndex) =>
          row.map((filled, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="rounded-full transition-colors duration-100"
              style={{
                width: dotSize,
                height: dotSize,
                backgroundColor: filled ? fillColor : baseColor,
              }}
            />
          )),
        )}
      </div>
    </div>
  )
}
