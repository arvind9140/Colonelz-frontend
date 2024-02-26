
import { useMemo, useState, useEffect } from 'react'
import Table from '@/components/ui/Table'
import Input from '@/components/ui/Input'
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFacetedMinMaxValues,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
} from '@tanstack/react-table'
import { rankItem } from '@tanstack/match-sorter-utils'
import { ApiResponse, Quotation} from './finalData'
import type { ColumnDef, FilterFn, ColumnFiltersState } from '@tanstack/react-table'
import type { InputHTMLAttributes } from 'react'
import { useLocation } from 'react-router-dom'

interface DebouncedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size' | 'prefix'> {
    value: string | number
    onChange: (value: string | number) => void
    debounce?: number
}

const { Tr, Th, Td, THead, TBody, Sorter } = Table

function DebouncedInput({
    value: initialValue,
    onChange,
    debounce = 500,
    ...props
}: DebouncedInputProps) {
    const [value, setValue] = useState(initialValue)

    useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(value)
        }, debounce)

        return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    return (
        <div className="flex justify-end">
            <div className="flex items-center mb-4">
                <span className="mr-2">Search:</span>
                <Input
                    {...props}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
            </div>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    // Rank the item
    const itemRank = rankItem(row.getValue(columnId), value)

    // Store the itemRank info
    addMeta({
        itemRank,
    })

    // Return if the item should be filtered in/out
    return itemRank.passed
}



const FinalEstimate = () => {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState('')
    const location = useLocation();

    const [quotationData, setQuotationData] = useState<Quotation[]>([]);
    const [price,setprice]=useState<ApiResponse>()
const [loading, setLoading] = useState(true);
const searchParams = new URLSearchParams(location.search);
const projectId = searchParams.get('project_id');

useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch(`http://35.200.251.213/v1/api/admin/get/quotation/?project_id=${projectId}`);
      const data: ApiResponse = await response.json();
      if (data.status && data.data && data.data.main_quotation) {
        setQuotationData(data.data.main_quotation);
        setprice(data)
        console.log(data);
        
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);


    const columns = useMemo<ColumnDef<ApiResponse>[]>(
        () => [
            { header: 'Quotation ID', accessorKey: 'qutation_id' },
            { header: 'Type', accessorKey: 'type' },
            { header: 'Total Price', accessorKey: 'total_price' },
        ],
        []
    )

    const [data] = useState(() => quotationData)

    const table = useReactTable({
        data:quotationData,
        columns,
        filterFns: {
            fuzzy: fuzzyFilter,
        },
        state: {
            columnFilters,
            globalFilter,
        },
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: fuzzyFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues(),
        debugHeaders: true,
        debugColumns: false,
    })

    return (
        <>
            <DebouncedInput
                value={globalFilter ?? ''}
                className="p-2 font-lg shadow border border-block"
                placeholder="Search all columns..."
                onChange={(value) => setGlobalFilter(String(value))}
            />
            <Table>
                <THead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <Tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <Th
                                        key={header.id}
                                        colSpan={header.colSpan}
                                    >
                                        {header.isPlaceholder ? null : (
                                            <div
                                                {...{
                                                    className:
                                                        header.column.getCanSort()
                                                            ? 'cursor-pointer select-none'
                                                            : '',
                                                    onClick:
                                                        header.column.getToggleSortingHandler(),
                                                }}
                                            >
                                                {flexRender(
                                                    header.column.columnDef
                                                        .header,
                                                    header.getContext()
                                                )}
                                                {
                                                    <Sorter
                                                        sort={header.column.getIsSorted()}
                                                    />
                                                }
                                            </div>
                                        )}
                                    </Th>
                                )
                            })}
                        </Tr>
                    ))}
                </THead>
                <TBody>
                    {table.getRowModel().rows.map((row) => {
                        return (
                            <Tr key={row.id}>
                                {row.getVisibleCells().map((cell) => {
                                    return (
                                        <Td key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </Td>
                                    )
                                })}
                            </Tr>
                        )
                    })}
                </TBody>
            </Table>


            <div className='flex justify-end '><div><h6>Total: {price?.data.total_price}</h6>
            <h6>Taxes@18%: {price?.data.gst}</h6>
            <h6>Gross Total: {price?.data.total_price_with_gst}</h6></div></div>
        </>
    )
}

export default FinalEstimate

