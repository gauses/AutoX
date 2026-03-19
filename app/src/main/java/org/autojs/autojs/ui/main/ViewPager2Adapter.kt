package org.autojs.autojs.ui.main

import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.viewpager2.adapter.FragmentStateAdapter
import org.autojs.autojs.ui.main.log.MainLogFragment
import org.autojs.autojs.ui.main.scripts.ScriptListFragment
import org.autojs.autojs.ui.main.task.TaskManagerFragmentKt

class ViewPager2Adapter(
    fragmentActivity: FragmentActivity,
    private val scriptListFragment: ScriptListFragment,
    private val taskManagerFragment: TaskManagerFragmentKt,
    private val logListFragment: MainLogFragment
) : FragmentStateAdapter(fragmentActivity) {

    override fun createFragment(position: Int): Fragment {
        return when (position) {
            0 -> scriptListFragment
            1 -> taskManagerFragment
            else -> logListFragment
        }
    }

    override fun getItemCount(): Int = 3
}