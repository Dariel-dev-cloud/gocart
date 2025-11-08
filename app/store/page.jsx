'use client'
import Loading from "@/components/Loading"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { CircleDollarSignIcon, ShoppingBasketIcon, StarIcon, TagsIcon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

export default function Dashboard() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const { getToken } = useAuth()

    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [dashboardData, setDashboardData] = useState({
        totalProducts: 0,
        totalEarnings: 0,
        totalOrders: 0,
        ratings: [],
    })

    const dashboardCardsData = [
        { title: 'Total de Productos', value: dashboardData?.totalProducts || 0, icon: ShoppingBasketIcon },
        { title: 'Ganancias Totales', value: currency + (dashboardData?.totalEarnings?.toLocaleString() || 0), icon: CircleDollarSignIcon },
        { title: 'Total de Pedidos', value: dashboardData?.totalOrders || 0, icon: TagsIcon },
        { title: 'Total de Calificaciones', value: dashboardData?.ratings?.length || 0, icon: StarIcon },
    ]

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const token = await getToken()

            console.log('Fetching dashboard...') // ✅ Debug

            const { data } = await axios.get('/api/store/dashboard', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

            console.log('Response:', data) // ✅ Debug

            // ✅ CORREGIDO: Acceder a data.dashboardData
            if (data && data.dashboardData) {
                setDashboardData(data.dashboardData)
            } else {
                // Si no viene envuelto, usar directamente
                setDashboardData(data)
            }

        } catch (error) {
            console.error('Error:', error)
            toast.error(error?.response?.data?.error || 'Error al cargar el dashboard')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loading />
        </div>
    )

    return (
        <div className="text-slate-500 mb-28">
            <h1 className="text-2xl">Panel del <span className="text-slate-800 font-medium">Vendedor</span></h1>

            <div className="flex flex-wrap gap-5 my-10 mt-4">
                {
                    dashboardCardsData.map((card, index) => (
                        <div key={index} className="flex items-center gap-11 border border-slate-200 p-3 px-6 rounded-lg">
                            <div className="flex flex-col gap-3 text-xs">
                                <p>{card.title}</p>
                                <b className="text-2xl font-medium text-slate-700">{card.value}</b>
                            </div>
                            <card.icon size={50} className="w-11 h-11 p-2.5 text-slate-400 bg-slate-100 rounded-full" />
                        </div>
                    ))
                }
            </div>

            <h2 className="text-xl font-semibold text-slate-700 mb-4">Reseñas Totales</h2>

            <div className="mt-5">
                {
                    dashboardData?.ratings?.length > 0 ? (
                        dashboardData.ratings.map((review, index) => (
                            <div key={index} className="flex max-sm:flex-col gap-5 sm:items-center justify-between py-6 border-b border-slate-200 text-sm text-slate-600 max-w-4xl">
                                <div>
                                    <div className="flex gap-3">
                                        {/* ✅ CORREGIDO: Validar que user existe */}
                                        {review.user?.image && (
                                            <Image
                                                src={review.user.image}
                                                alt={review.user.name || 'Usuario'}
                                                className="w-10 aspect-square rounded-full"
                                                width={40}
                                                height={40}
                                            />
                                        )}
                                        <div>
                                            <p className="font-medium">{review.user?.name || 'Anónimo'}</p>
                                            <p className="font-light text-slate-500">
                                                {new Date(review.createdAt).toLocaleDateString('es-ES', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-slate-500 max-w-xs leading-6">{review.review}</p>
                                </div>
                                <div className="flex flex-col justify-between gap-6 sm:items-end">
                                    <div className="flex flex-col sm:items-end">
                                        <p className="text-slate-400">{review.product?.category || 'Sin categoría'}</p>
                                        <p className="font-medium">{review.product?.name || 'Producto'}</p>
                                        <div className='flex items-center'>
                                            {Array(5).fill('').map((_, starIndex) => (
                                                <StarIcon
                                                    key={starIndex}
                                                    size={17}
                                                    className='text-transparent mt-0.5'
                                                    fill={review.rating >= starIndex + 1 ? "#00C950" : "#D1D5DB"}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/product/${review.product?.id}`)}
                                        className="bg-slate-100 px-5 py-2 hover:bg-slate-200 rounded transition-all"
                                        disabled={!review.product?.id}
                                    >
                                        Ver Producto
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-slate-50 rounded-lg">
                            <StarIcon size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-400 text-lg">No hay reseñas disponibles</p>
                            <p className="text-slate-400 text-sm mt-2">Las reseñas aparecerán aquí cuando los clientes califiquen tus productos</p>
                        </div>
                    )
                }
            </div>
        </div>
    )
}