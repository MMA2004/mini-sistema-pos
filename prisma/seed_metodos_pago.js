import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Sembrando métodos de pago iniciales...')

    const metodos = [
        {
            codigo: 'EFECTIVO',
            nombre: 'Efectivo',
            activo: true,
            requiere_referencia: false,
            permite_cambio: true,
            orden: 1,
        },
        {
            codigo: 'TARJETA_DEBITO',
            nombre: 'Tarjeta Débito',
            activo: true,
            requiere_referencia: true,
            permite_cambio: false,
            orden: 2,
        },
        {
            codigo: 'TARJETA_CREDITO',
            nombre: 'Tarjeta Crédito',
            activo: true,
            requiere_referencia: true,
            permite_cambio: false,
            orden: 3,
        },
        {
            codigo: 'TRANSFERENCIA',
            nombre: 'Transferencia Bancaria',
            activo: true,
            requiere_referencia: true,
            permite_cambio: false,
            orden: 4,
        },
        {
            codigo: 'NEQUI',
            nombre: 'Nequi',
            activo: true,
            requiere_referencia: true,
            permite_cambio: false,
            orden: 5,
        },
        {
            codigo: 'DAVIPLATA',
            nombre: 'Daviplata',
            activo: true,
            requiere_referencia: true,
            permite_cambio: false,
            orden: 6,
        },
    ]

    for (const m of metodos) {
        await prisma.metodoPagoConfig.upsert({
            where: { codigo: m.codigo },
            update: {
                nombre: m.nombre,
                activo: m.activo,
                requiere_referencia: m.requiere_referencia,
                permite_cambio: m.permite_cambio,
                orden: m.orden,
            },
            create: m,
        })
    }

    console.log('✓ Métodos de pago sembrados correctamente.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
