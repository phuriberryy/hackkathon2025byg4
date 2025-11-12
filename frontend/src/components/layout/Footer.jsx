import { Leaf } from 'lucide-react'

function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* CMU ShareCycle Info */}
        <div className="mx-auto max-w-md text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-md">
              <Leaf size={24} />
            </div>
            <div>
              <p className="text-lg font-bold text-primary">CMU ShareCycle</p>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Green Campus Initiative
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-gray-600">
            Share More, Waste Less. Building a sustainable campus community together.
          </p>
        </div>

        {/* Bottom */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <p className="text-center text-xs text-gray-500">
            Do not sell or share my personal info
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
